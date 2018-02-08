var restify = require('restify');
var Web3 = require('web3');
const util = require('ethereumjs-util');
var config = require('./config.json');
const bodyParser = require('body-parser');
var BigNumber = require('bignumber.js');
var web3;

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3Ropsten.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider(config.httpProvider));
}

if (web3.isConnected()) {
    console.log("Web3 connected");
} else {
    console.log("Web3 is not connected")
}
var crowdsaleABI = require('./crowdsaleABI.json');
var vestingABI = require('./tokenVestingABI.json');
var crowdsaleAddress = config.crowdsaleAddress;
var vestingAddress = config.vestingAddress;
var crowdsaleInstance = web3.eth.contract(crowdsaleABI).at(crowdsaleAddress);
var vestingInstance = web3.eth.contract(vestingABI).at(vestingAddress);

function respond(req, res, next) {

    if(web3.isConnected()){
            try{
                var result = [];
                
                var weiRaised =  crowdsaleInstance.weiRaised.call();
                var weiCap =  crowdsaleInstance.weiCap.call();
                var isMinimumGoalReached = crowdsaleInstance.isMinimumGoalReached.call();
                var state = crowdsaleInstance.getState.call();
                var endsAt =  crowdsaleInstance.endsAt.call();
                var investorCount = crowdsaleInstance.investorCount.call();
                var tokensSold = crowdsaleInstance.tokensSold.call();
                var minimumFundingGoal = crowdsaleInstance.minimumFundingGoal.call();

                result.push({'status':'success','message':'',
                    'data':{'weiRaised':weiRaised,
                    'weiCap':weiCap,
                    'isMinimumGoalReached':isMinimumGoalReached,
                    'state':state,
                    'endsAt':endsAt,
                    'investorCount':investorCount,
                    'tokensSold':tokensSold,
                    'minimumFundingGoal':minimumFundingGoal}});

                res.json(result);
            } catch (err) {
                // handle the error safely
                console.log(err);
                res.json({'status':'failed','message':'Error while fetching data'});
            }

        next();
    }else{
        res.json({'status':'failed','message':'Problem connecting to the network'});
    }
}

function isWhitelisted(req, res, next) {
    if (!req.method === 'POST') {
        return next();
    }

    if(web3.isConnected()){
            try{
                var userAddress = req.body.userAddress;
                if(userAddress != null){
                    var result = [];
                    var isWhitelisted =  crowdsaleInstance.earlyParticipantWhitelist(userAddress);

                    result.push({'status':'success','message':'',
                        'data':{'isWhitelisted':isWhitelisted}
                    });
                    res.json(result);
                }else{
                    res.json({'status':'failed','message':'Please provide an address'});
                }
            } catch (err) {
                // handle the error safely
                console.log(err);
                res.json({'status':'failed','message':'Error while fetching data'});
            }

        next();
    }else{
        res.json({'status':'failed','message':'Problem connecting to the network'});
    }
}

function getVestingMap(req, res, next) {
    if (!req.method === 'POST') {
        return next();
    }

    if(web3.isConnected()){
            try{
                var userAddress = req.body.userAddress;
                if(userAddress != null){
                    var result = [];
                    var vestingMap =  vestingInstance.vestingMap(userAddress);

                    result.push({'status':'success','message':'',
                        'data':{'startAt':new BigNumber(vestingMap[0]).toNumber(),
                                'principleLockAmount':new BigNumber(vestingMap[1]).toNumber(),
                                'principleLockPeriod':new BigNumber(vestingMap[2]).toNumber(),
                                'bonusLockAmount':new BigNumber(vestingMap[3]).toNumber(),
                                'bonusLockPeriod':new BigNumber(vestingMap[4]).toNumber(),
                                'amountReleased':new BigNumber(vestingMap[5]).toNumber(),
                                'isPrincipleReleased':vestingMap[6],
                                'isBonusReleased':vestingMap[7]}
                        });
                    res.json(result);
                }else{
                    res.json({'status':'failed','message':'Please provide an address'});
                }
            } catch (err) {
                // handle the error safely
                console.log(err);
                res.json({'status':'failed','message':'Error while fetching data'});
            }

        next();
    }else{
        res.json({'status':'failed','message':'Problem connecting to the network'});
    }
}

var server = restify.createServer();
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.get('/crowdsale/', respond);
server.post('/crowdsale/isWhitelisted/',isWhitelisted);
server.post('/crowdsale/vestingMap/',getVestingMap);

server.listen(process.env.PORT, function() {
  console.log('%s listening at %s', server.name, server.url);
});
