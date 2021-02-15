const AMF = artifacts.require("AMF");
const { assert } = require('chai');
const ethers = require('ethers');
const ozhelper = require('openzeppelin-test-helpers');


contract('AMF', (accounts) => {

  it('onlyOwner methods should be callable only by contract owner', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF');
    const admin = accounts[0];
    const user = accounts[1] ;
    const tokenAmount = 666;
    const btcAmount = 1000111000
    const ratio = 54321;
    const btcTxId = '0x4b51e7469d6e9aec84c7140c078dd5251374811dbae4acf654d7edc0a8872e2d';
    const ethTxId = '0x8131148abe1e4e55a371ba37de9fedd276fcbea24dea25a52e987ad83e7b59fc';

    await ozhelper.expectRevert(amf.mint(user, tokenAmount, { from: user }), `caller is not the owner`);
    await ozhelper.expectRevert(amf.setBtcToAmfRatio(ratio, { from: user }), `caller is not the owner`);
    await ozhelper.expectRevert(amf.tokenDelivery(btcTxId, user, tokenAmount, { from: user }), `caller is not the owner`);
    await ozhelper.expectRevert(amf.btcDelivery(ethTxId, user, btcAmount, { from: user }), `caller is not the owner`);
  });

  it('should mint 666 AMF to address 0 and raise total supply accordingly', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF');
    const tokenAmount = 666;

    const initialSupply = await amf.totalSupply();
    assert.equal(initialSupply.valueOf().toNumber(), 0, `initial supply is different from zero`);

    await amf.mint(accounts[0], tokenAmount);
    const balance = await amf.balanceOf(accounts[0]);
    assert.equal(balance.valueOf().toNumber(), tokenAmount, `could not mint 666 to ${accounts[0]}`);

    const newSupply = await amf.totalSupply();
    assert.equal(newSupply.valueOf().toNumber(), tokenAmount, `new token supply was supposed to be ${tokenAmount}`);
  });

  it('should burn 666 AMF and decrease balance and supply accordingly', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF');
    const initialAmount = 1337;
    const burnAmount = 666;
    const admin = accounts[0];
    const user = accounts[1];

    await amf.mint(user, initialAmount, {from:admin});
    await amf.burn(burnAmount, { from: user });
    const newBalance = await amf.balanceOf(user);
    assert.equal(newBalance.valueOf().toNumber(), initialAmount-burnAmount);

    const newSupply = await amf.totalSupply();
    assert.equal(newSupply.valueOf().toNumber(), initialAmount-burnAmount);
  });

  it('initial BtcToAmfRatio should equal 100000', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF');
    const initialRatio = 100000;

    const ratio = await amf.getBtcToAmfRatio();
    assert.equal(ratio.valueOf().toNumber(), initialRatio);
  });

  it('initial BtcToAmfRatio can be overridden', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF');
    const newRatio = 98765;
    const admin = accounts[0];  

    await amf.setBtcToAmfRatio(newRatio, { from: admin });
    const updatedRatio = await amf.getBtcToAmfRatio();
    assert.equal(updatedRatio.valueOf().toNumber(), newRatio, `Could not set BtcToAmfRatio to ${newRatio}`);
  });

  it('should claimBtc with given BTC address bech32', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF');
    const admin = accounts[0];
    const user = accounts[1];
    const btcAddress = 'bc1qu3hn8ethh3rd0wrfpm0qfwrs0cvvfj45npgaz8';
    const tokenAmount = 666;

    await amf.mint(user, tokenAmount, { from: admin });
    const claimOutput = await amf.claimBTC(tokenAmount, btcAddress, { from: user });

    const btcToBePaidEvent = claimOutput.logs[1];
    assert.equal(btcToBePaidEvent.args.userBtcAddress, btcAddress, 'Invalid BTC adress in BtcToBePaid event');

    const ownerBalance = await amf.balanceOf(await amf.owner());
    assert.equal(ownerBalance.valueOf().toNumber(), tokenAmount, `Pool balance should be equal to : ${tokenAmount}`);

    const userBalance = await amf.balanceOf(user);
    assert.equal(userBalance.valueOf().toNumber(), 0, `User balance should be equal to : 0`);
  });

  it('should claimBtc with given parameters', async () => {
    const amf = await AMF.new('AMFeix', 'AMF');
    const user = accounts[1];
    const btcAddress = '1QATswVJC5LMRxxARzFmidQ6PrfgnJy5Bu';
    const tokenAmount = 666;

    await amf.mint(user, tokenAmount);
    const balance = await amf.balanceOf(user);
    assert.equal(balance.valueOf().toNumber(), tokenAmount, `could not mint ${tokenAmount} to user`);

    const claimOutput = await amf.claimBTC(tokenAmount, btcAddress, { from: user })

    const btcToBePaidEvent = claimOutput.logs[1];
    assert.equal(btcToBePaidEvent.args.userBtcAddress, btcAddress, 'Invalid BTC adress in BtcToBePaid event');

    const ownerBalance = await amf.balanceOf(await amf.owner());
    assert.equal(ownerBalance.valueOf().toNumber(), tokenAmount, `Pool balance should be equal to : ${tokenAmount}`);

    const userBalance = await amf.balanceOf(user);
    assert.equal(userBalance.valueOf().toNumber(), 0, `User balance should be equal to : 0`);
  });

  it('should tokenDelivery with given parameters', async () => {
    const amf = await AMF.new('AMFeix', 'AMF');
    const btcTxId = '0x4b51e7469d6e9aec84c7140c078dd5251374811dbae4acf654d7edc0a8872e2d';
    const admin = accounts[0];
    const user = accounts[1];    
    const adminInitialAmount = 1337;
    const userAmount = 666;

    await amf.mint(admin, adminInitialAmount);
    const event = await amf.tokenDelivery(btcTxId, user, userAmount);
    assert.exists(event.logs);

  });

  it('Check if filtering on PaidToken event is working', async () => {
    const amf = await AMF.new('AMFeix', 'AMF');
    const admin = accounts[0];
    const tokenAmount = 666;

    await amf.mint(admin, tokenAmount);

    const txIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map(ethers.utils.formatBytes32String);
    // a => 0x6100000000000000000000000000000000000000000000000000000000000000

    const txIdToSearchInEvents = ethers.utils.formatBytes32String('g');
    const customer = '0x8BE57aB7e663A36cc3D71eAC880234C3d660621F';

    await Promise.all(txIds.map(txId => amf.tokenDelivery(txId, customer, 10)));

    const contract = new ethers.Contract(amf.address, amf.abi, new ethers.providers.JsonRpcProvider());
    const interface = new ethers.utils.Interface(amf.abi);
    const provider = new ethers.providers.JsonRpcProvider(ethers.ethers.utils.ConnectionInfo);
    const eventFilter = contract.filters.PaidToken(txIdToSearchInEvents);
    // @see https://github.com/ethers-io/ethers.js/issues/204
    const eventFilterWithBlock = {
      fromBlock: 1,
      toBlock: 'latest',
      ...eventFilter
    };

    const logs = await provider.getLogs(eventFilterWithBlock);
    const parsedLog = interface.parseLog(logs[0]);
    assert.equal(parsedLog.args.btcTxId, txIdToSearchInEvents, 'Txid not found in PaidToken events');
  });

   it('should find txid in BtcToBePaid events after a claimBTC', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF');
    const user = accounts[1];
    const tokenAmount = 500;

    await amf.mint(user, tokenAmount);

    const balance = await amf.balanceOf(user);
    assert.equal(balance.valueOf().toNumber(), tokenAmount, `could not mint ${tokenAmount} to user`);

    const btcAddress = '1QATswVJC5LMRxxARzFmidQ6PrfgnJy5Bu';

    await amf.claimBTC(15, btcAddress, { from: user })
    await amf.claimBTC(85, btcAddress, { from: user })

    const contract = new ethers.Contract(amf.address, amf.abi, new ethers.providers.JsonRpcProvider());
    const provider = new ethers.providers.JsonRpcProvider(ethers.ethers.utils.ConnectionInfo);
    const eventFilter = contract.filters.BtcToBePaid();

    // @see https://github.com/ethers-io/ethers.js/issues/204
    const eventFilterWithBlock = {
      fromBlock: 1,
      toBlock: 'latest',
      ...eventFilter
    };

    const logs = await provider.getLogs(eventFilterWithBlock);
    const numberOfClaims = 2;
    assert.equal(logs.length, numberOfClaims, 'Invalid claim event count');



    it('full story test', async () => {
      const amf = await AMF.new('AMFEIX', 'AMF');
      const contract = new ethers.Contract(amf.address, amf.abi, new ethers.providers.JsonRpcProvider());
      const interface = new ethers.utils.Interface(amf.abi);
      const provider = new ethers.providers.JsonRpcProvider(ethers.ethers.utils.ConnectionInfo);
      const admin = accounts[0];
      const user1 = accounts[1];  
      const user2 = accounts[2];
      const btcDepositTxId1 = '0x4b51e7469d6e9aec84c7140c078dd5251374811dbae4acf654d7edc0a8872e2d';
      const btcDepositTxId2 = '0x51374811dbae4acf654d7edc0a8872e2d4b51e7469d6e9aec84c7140c078dd52';
      const ethTxId = '0xd6dc617db05e69c7f78e305d60503484ebfad0b24a72b2fe20b8e5f63253f995';
      const btcAddress1 = '1QATswVJC5LMRxxARzFmidQ6PrfgnJy5Bu';
      const btcAddress2 = '3LOLswVJC5LMRxxARzFmidQ6PrfgnJBuBu';
  
      const adminInitialAmount = 1337;
      const btcDepositAmount1 = 35000000; // in sat
      const btcDepositAmount2 = 5000000; // in sat
      const ratio1 = 99888;
      const ratio2 = 88777;
      const tokenAmount1 = 666;
      const tokenAmount1_ = 555;
      const tokenAmount2 = 111;
  
      // initializes supply for admin
      await amf.mint(admin, adminInitialAmount);

      // DAY 1
      // user1 deposited  0.35 BTC at its local BTC wallet and transfered from it to AMFEIX.
      // AMFEIX watchs the formerly provided BTC address to retrieve the amount of BTC and the user ETH address.
      // Once confirmed AMFEIX needs to deliver an amount of tokens to this address at current `BtcToAmfRatio`
      // But before that AMFEIX needs to update the ratio AND check wether the delivery has already happened

      // updates ratio
      await amf.setBtcToAmfRatio(ratio1, { from: admin });
      const updatedRatio1 = await amf.getBtcToAmfRatio();
      assert.equal(updatedRatio1.valueOf().toNumber(), ratio1);

      // checks that PaidToken event doesn't already exist for the specific btcTxId
      const eventFilterPaidToken1 = contract.filters.PaidToken(btcDepositTxId1);
      const paidTokenFilterWithBlock1 = {
        fromBlock: 1,
        toBlock: 'latest',
        ...eventFilterPaidToken1
      };
      const paidTokenLog = await provider.getLogs(paidTokenFilterWithBlock1);
      assert.equal(paidTokenLog.length, 0);

      // send tokens to user1 with current ratio
      await amf.tokenDelivery(btcDepositTxId1, user1, tokenAmount1);

      // checks user1 and admin new balances
      const newBalanceUser1 = await amf.balanceOf(user1);
      const newBalanceAdmin = await amf.balanceOf(admin);
      assert.equal(newBalanceUser1.valueOf().toNumber(), tokenAmount1);
      assert.equal(newBalanceAdmin.valueOf().toNumber(), adminInitialAmount-tokenAmount1);

      // checks token delivery associated event
      const newLogs = await provider.getLogs(paidTokenFilterWithBlock1);
      const parsedLogs = interface.parseLog(newLogs[0]);
      //console.log('PARSED LOG: ', parsedLogs);
      assert.equal(parsedLogs.args.btcTxId, btcDepositTxId1);
      assert.equal(parsedLogs.args.btcToAmfRatio, ratio1);

      // DAY 2
      // user2 deposited  0.05 BTC at its local BTC wallet and transfered from it to AMFEIX.
      // User1 want its BTC back so he calls the claimBTC god.

      // updates ratio
      await amf.setBtcToAmfRatio(ratio2, { from: admin });
      const updatedRatio2 = await amf.getBtcToAmfRatio();
      assert.equal(updatedRatio2.valueOf().toNumber(), ratio2);

      // checks that PaidToken event doesn't already exist for the specific btcTxId
      const eventFilterPaidToken2 = contract.filters.PaidToken(btcDepositTxId2);
      const paidTokenFilterWithBlock2 = {
        fromBlock: 1,
        toBlock: 'latest',
        ...eventFilterPaidToken2
      };
      const paidTokenLog2 = await provider.getLogs(paidTokenFilterWithBlock2);
      assert.equal(paidTokenLog2.length, 0);

      // send tokens to user2 with current ratio
      await amf.tokenDelivery(btcDepositTxId2, user2, tokenAmount2);

      // checks user2 and admin new balances
      const newBalanceUser2 = await amf.balanceOf(user2);
      const newBalanceAdmin2 = await amf.balanceOf(admin);
      assert.equal(newBalanceUser2.valueOf().toNumber(), tokenAmount2);
      assert.equal(newBalanceAdmin2.valueOf().toNumber(), newBalanceAdmin-tokenAmount2);

      // checks token delivery associated event
      const newLogs2 = await provider.getLogs(paidTokenFilterWithBlock2);
      assert.equal(newLogs2.length, 1);
      const parsedLogs2 = interface.parseLog(newLogs2[0]);
      assert.equal(parsedLogs2.args.btcTxId, btcDepositTxId2);
      assert.equal(parsedLogs2.args.btcToAmfRatio, ratio2);

      // checks that PaidToken event doesn't already exist for the specific btcTxId
      const eventFilterPaidBTC = contract.filters.PaidBTC(ethTxId);
      const paidBtcFilterWithBlock = {
        fromBlock: 1,
        toBlock: 'latest',
        ...eventFilterPaidBTC
      };
      const paidBtcLog = await provider.getLogs(paidBtcFilterWithBlock);
      assert.equal(paidBtcLog.length, 0);


      // user1 calls the method `claimBTC`
      await amf.claimBTC(tokenAmount1_, btcAddress1, { from: user1 });
      const newBalanceUser1_ = await amf.balanceOf(user1);
      assert.equal(newBalanceUser1_, tokenAmount1-tokenAmount1_);

      // checks associated event
      const eventFilterBtcToBePaid = contract.filters.BtcToBePaid(user1);
      const BtcToBePaidFilterWithBlock = {
        fromBlock: 1,
        toBlock: 'latest',
        ...eventFilterBtcToBePaid
      };
      const newLogs3 = await provider.getLogs(BtcToBePaidFilterWithBlock);
      assert.equal(newLogs3.length, 1);
      const parsedLogs3 = interface.parseLog(newLogs3[0]);
      assert.equal(parsedLogs3.args.customer, user1);
      assert.equal(parsedLogs3.args.userBtcAddress, btcAddress1);
      assert.equal(parsedLogs3.args.sentToken, tokenAmount1_);

      // send btc to user1 and notifies the network
      const tokenTransferTxId = newLogs3[0].transactionHash;
      await amf.btcDelivery(tokenTransferTxId, user1, btcDepositAmount1);
      
      // checks token delivery associated event
      const eventFilterPaidBTC2 = contract.filters.PaidBTC(tokenTransferTxId);
      const paidBtcFilterWithBlock2 = {
        fromBlock: 1,
        toBlock: 'latest',
        ...eventFilterPaidBTC2
      };
      const newLogs4 = await provider.getLogs(paidBtcFilterWithBlock2);
      assert.equal(newLogs4.length, 1);
      const parsedLogs4 = interface.parseLog(newLogs4[0]);
      assert.equal(parsedLogs4.args.ethTxId, tokenTransferTxId);
      assert.equal(parsedLogs4.args.customer, user1);
      assert.equal(parsedLogs4.args.btcToAmfRatio, ratio2);
    });
  });
});
