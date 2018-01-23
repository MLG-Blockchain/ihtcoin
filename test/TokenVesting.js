'use strict';

const assertJump = require('./helpers/assertJump');
const timer = require('./helpers/timer');
var Token = artifacts.require("./CrowdsaleToken.sol");
var TokenVesting = artifacts.require("./TokenVesting.sol");

function etherInWei(x) {
    return web3.toBigNumber(web3.toWei(x, 'ether')).toNumber();
}

function tokenInSmallestUnit(tokens, _tokenDecimals) {
    return Math.floor(tokens * Math.pow(10, _tokenDecimals));
}

contract('Token Vesting', function(accounts) {
    var _tokenName = "TOSHCOIN";
    var _tokenSymbol = "TOSH";
    var _tokenDecimals = 8;
    var _tokenInitialSupply = tokenInSmallestUnit(0, _tokenDecimals);
    var _tokenMintable = true;
    var _now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    var _countdownInSeconds = 100;
    var decimals = _tokenDecimals;

    var tokenInstance;
    var vestingInstance;
    
    beforeEach(async() => {
        tokenInstance = await Token.new(_tokenName, _tokenSymbol, _tokenInitialSupply, _tokenDecimals, _tokenMintable);
        vestingInstance = await TokenVesting.new(tokenInstance.address);
        var tokenAmount = etherInWei(50000, _tokenDecimals);
        await tokenInstance.setMintAgent(accounts[0], true);
        await tokenInstance.mint(vestingInstance.address,tokenAmount);
    });

    it('Initializing : should be able to set allocate agent', async function() {
        await vestingInstance.setAllocateAgent(accounts[1],true);
        let allocateAgentStatus = await vestingInstance.allocateAgents.call(accounts[1]);
        assert.equal(allocateAgentStatus, true, "Could not set allocate agent");
    });

    it('Vesting : Should fail if not called from an allocate agent address', async function(){
        var _principleLockAmount = tokenInSmallestUnit(100);
        var _bonusLockAmount = tokenInSmallestUnit(20);
        var _principleLockPeriod = 3600;
        var _bonusLockPeriod = 1200;
        try {
            await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown exception before');
    });
    it('Vesting : Should be set properly', async function() {
        var _principleLockAmount = tokenInSmallestUnit(100);
        var _bonusLockAmount = tokenInSmallestUnit(20);
        var _principleLockPeriod = 3600;
        var _bonusLockPeriod = 1200;
        await vestingInstance.setAllocateAgent(accounts[1],true);
        await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});

        assert.equal(await vestingInstance.isVestingSet.call(accounts[2]), true);
    });
    // it('Vesting : should not able to change vesting params once set', async function() {
    //     var _principleLockAmount = tokenInSmallestUnit(100);
    //     var _bonusLockAmount = tokenInSmallestUnit(20);
    //     var _principleLockPeriod = 3600;
    //     var _bonusLockPeriod = 1200;
    //     await vestingInstance.setAllocateAgent(accounts[1],true);
    //     await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});

    //     try {
    //         await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});
    //     } catch (error) {
    //         return assertJump(error);
    //     }
    //     assert.fail('should have thrown exception before');
    // });
    it('Self Release: should not be able to release before vesting is over.', async function() {
        var _principleLockAmount = tokenInSmallestUnit(100);
        var _bonusLockAmount = tokenInSmallestUnit(20);
        var _principleLockPeriod = 3600;
        var _bonusLockPeriod = 1200;
        await vestingInstance.setAllocateAgent(accounts[1],true);
        await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});

        try {
            await vestingInstance.releaseMyVestedTokens({from : accounts[2]});
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown exception before');
    });

    it('Releasing : should not be able to release before vesting is over.', async function() {
        var _principleLockAmount = tokenInSmallestUnit(100);
        var _bonusLockAmount = tokenInSmallestUnit(20);
        var _principleLockPeriod = 3600;
        var _bonusLockPeriod = 1200;
        await vestingInstance.setAllocateAgent(accounts[1],true);
        await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});

        try {
            await vestingInstance.releaseVestedTokens(accounts[2]);
        } catch (error) {
            return assertJump(error);
        }
        assert.fail('should have thrown exception before');
    });

    // it('Releasing : should only release the milestone which has vested.', async function() {
    //     var _principleLockAmount = tokenInSmallestUnit(100);
    //     var _bonusLockAmount = tokenInSmallestUnit(20);
    //     var _principleLockPeriod = 60;
    //     var _bonusLockPeriod = 100;
    //     await vestingInstance.setAllocateAgent(accounts[1],true);
    //     await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});

    //     await timer(60);

    //     await vestingInstance.releaseVestedTokens(accounts[2]);
    //     assert.equal(await tokenInstance.balanceOf(accounts[2]), _principleLockAmount);

    // });

    // it('Releasing : should release the entire amount if all the milestones have vested.', async function() {
    //     var _principleLockAmount = tokenInSmallestUnit(100);
    //     var _bonusLockAmount = tokenInSmallestUnit(20);
    //     var _principleLockPeriod = 60;
    //     var _bonusLockPeriod = 100;
    //     await vestingInstance.setAllocateAgent(accounts[1],true);
    //     await vestingInstance.setVesting(accounts[2],_principleLockAmount,_bonusLockAmount,_principleLockPeriod,_bonusLockPeriod,{from : accounts[1]});

    //     await timer(100);

    //     await vestingInstance.releaseVestedTokens(accounts[2]);
    //     assert.equal(await tokenInstance.balanceOf(accounts[2]), tokenInSmallestUnit(120));

    // });

});