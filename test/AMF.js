const AMF = artifacts.require("AMF");
const { assert } = require('chai');
const ethers = require('ethers');
const ozhelper = require('openzeppelin-test-helpers');


contract('AMF', (accounts) => {

  it('onlyOwner methods should be callable only by contract owner', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const admin = accounts[0];
    const user = accounts[1] ;
    const tokenAmount = 666;
    const btcAmount = 1000111000
    const btcAddress = '1QATswVJC5LMRxxARzFmidQ6PrfgnJy5Bu';
    const ethAddress = accounts[2];
    const ratio = 54321;

    await ozhelper.expectRevert(amf.mint(user, tokenAmount, { from: user }), `caller is not the owner`);
    await ozhelper.expectRevert(amf.setSwapRatio(ratio, { from: user }), `caller is not the owner`);
    await ozhelper.expectRevert(amf.setTokenPoolAddress(ethAddress, { from: user }), `caller is not the owner`);
    await ozhelper.expectRevert(amf.setBtcPoolAddress(btcAddress, { from: user }), `caller is not the owner`);
  });

  it('should update the token pool address', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const initialTokenPool = await amf.getTokenPoolAddress();
    const newTokenPool = '0x419c661aC46cECFb861379DD56e19568Bef21573';
    assert.equal(initialTokenPool, 0xf05389715791152d36a5C1A458c5198BC65543B9);

    const changePool = await amf.setTokenPoolAddress(newTokenPool);
    const changePoolLog = changePool.logs;
    assert.equal(changePoolLog[0].event, 'TokenPoolAddressChanged');

    const checkPool = await amf.getTokenPoolAddress();
    assert.equal(checkPool, newTokenPool);
  })

  it('should update the BTC pool address', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const initialBtcPool = await amf.getBtcPoolAddress();
    const newBtcPool = '1GckU2p2jM7ssNRgJzjUqXdnccuPmYq5J1';
    assert.equal(initialBtcPool, '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');

    const changePool = await amf.setBtcPoolAddress(newBtcPool);
    const changePoolLog = changePool.logs;
    assert.equal(changePoolLog[0].event, 'BtcPoolAddressChanged');

    const checkPool = await amf.getBtcPoolAddress();
    assert.equal(checkPool, newBtcPool);
  })

  it('should mint 666 AMF to user1 address and raise total supply accordingly', async () => {
  const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
  const user1 = accounts[1];
  const tokenAmount = 666;

  const initialSupply = await amf.totalSupply();
  assert.equal(initialSupply.valueOf().toNumber(), 0, `initial supply is different from zero`);
  
  await amf.mint(user1, tokenAmount);
  const balance = await amf.balanceOf(user1);
  assert.equal(balance.valueOf().toNumber(), tokenAmount, `could not mint 666 to ${user1}`);

  const newSupply = await amf.totalSupply();
  assert.equal(newSupply.valueOf().toNumber(), tokenAmount, `new token supply was supposed to be ${tokenAmount}`);
  });

  it('should burn 666 AMF and decrease balance and supply accordingly', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
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

  it('initial swap ratio should equal 100000', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const initialRatio = 100000;

    const ratio = await amf.getSwapRatio();
    assert.equal(ratio.valueOf().toNumber(), initialRatio);
  });

  it('should update swap ratio', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const newRatio = 98765;
    const admin = accounts[0];

    const changeRatio = await amf.setSwapRatio(newRatio, { from: admin });
    const changeRatioLog = changeRatio.logs;
    assert.equal(changeRatioLog[0].event, 'RatioChanged');

    const updatedRatio = await amf.getSwapRatio();
    assert.equal(updatedRatio.valueOf().toNumber(), newRatio, `Could not set BtcToAmfRatio to ${newRatio}`);
  });

  it('should claimBtc with given BTC address bech32', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const admin = accounts[0];
    const user = accounts[1];
    const btcAddress = 'bc1qu3hn8ethh3rd0wrfpm0qfwrs0cvvfj45npgaz8';
    const tokenAmount = 666;

    await amf.mint(user, tokenAmount, { from: admin });
    const claimOutput = await amf.claimBTC(tokenAmount, btcAddress, { from: user });

    const btcToBePaidEvent = claimOutput.logs[1];
    assert.equal(btcToBePaidEvent.args.userBtcAddress, btcAddress, 'Invalid BTC adress in BtcToBePaid event');

    const ownerBalance = await amf.balanceOf(await amf.getTokenPoolAddress());
    assert.equal(ownerBalance.valueOf().toNumber(), tokenAmount, `Pool balance should be equal to : ${tokenAmount}`);

    const userBalance = await amf.balanceOf(user);
    assert.equal(userBalance.valueOf().toNumber(), 0, `User balance should be equal to : 0`);
  });

  it('should claimBtc with given parameters', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const user = accounts[1];
    const btcAddress = '1QATswVJC5LMRxxARzFmidQ6PrfgnJy5Bu';
    const tokenAmount = 666;

    await amf.mint(user, tokenAmount);
    const balance = await amf.balanceOf(user);
    assert.equal(balance.valueOf().toNumber(), tokenAmount, `could not mint ${tokenAmount} to user`);

    const claimOutput = await amf.claimBTC(tokenAmount, btcAddress, { from: user })

    const btcToBePaidEvent = claimOutput.logs[1];
    assert.equal(btcToBePaidEvent.args.userBtcAddress, btcAddress, 'Invalid BTC adress in BtcToBePaid event');

    const ownerBalance = await amf.balanceOf(await amf.getTokenPoolAddress());
    assert.equal(ownerBalance.valueOf().toNumber(), tokenAmount, `Pool balance should be equal to : ${tokenAmount}`);

    const userBalance = await amf.balanceOf(user);
    assert.equal(userBalance.valueOf().toNumber(), 0, `User balance should be equal to : 0`);
  });

  it('should find txid in BtcToBePaid filtered events after a claimBTC', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
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
  });


  it('full story test', async () => {
    const amf = await AMF.new('AMFEIX', 'AMF', '0xf05389715791152d36a5C1A458c5198BC65543B9', '15uRgxLFhWFp5RuR3CbtdsX3SjACzabjCX');
    const contract = new ethers.Contract(amf.address, amf.abi, new ethers.providers.JsonRpcProvider());
    const interface = new ethers.utils.Interface(amf.abi);
    const provider = new ethers.providers.JsonRpcProvider(ethers.ethers.utils.ConnectionInfo);
    const admin = accounts[0];
    const user1 = accounts[1];  
    const user2 = accounts[2];
    const tokenPool = accounts[3];
    const btcDepositTxId1 = '0x4b51e7469d6e9aec84c7140c078dd5251374811dbae4acf654d7edc0a8872e2d';
    const btcDepositTxId2 = '0x51374811dbae4acf654d7edc0a8872e2d4b51e7469d6e9aec84c7140c078dd52';
    const ethTxId = '0xd6dc617db05e69c7f78e305d60503484ebfad0b24a72b2fe20b8e5f63253f995';
    const btcAddress1 = '1QATswVJC5LMRxxARzFmidQ6PrfgnJy5Bu';
    const btcAddress2 = '3LOLswVJC5LMRxxARzFmidQ6PrfgnJBuBu';

    const tokenPoolInitialAmount = 1337;
    const btcDepositAmount1 = 35000000; // in sat
    const btcDepositAmount2 = 5000000; // in sat
    const ratio1 = 99888;
    const ratio2 = 88777;
    const tokenAmount1 = 666;
    const tokenAmount1_ = 555;
    const tokenAmount2 = 111;

    // initializes supply for admin
    await amf.mint(tokenPool, tokenPoolInitialAmount);

    // DAY 1
    // user1 deposited  0.35 BTC at its local BTC wallet and transfered from it to AMFEIX.
    // AMFEIX watchs the formerly provided BTC address to retrieve the amount of BTC and the user ETH address.
    // Once confirmed AMFEIX needs to deliver an amount of tokens to this address at current `swapRatio`
    // But before that AMFEIX needs to update the ratio AND check wether the delivery has already happened

    // updates ratio
    await amf.setSwapRatio(ratio1, { from: admin });
    const updatedRatio1 = await amf.getSwapRatio();
    assert.equal(updatedRatio1.valueOf().toNumber(), ratio1);

    // transfers from tokenPool to user1
    await amf.transfer(user1, tokenAmount1, { from: tokenPool })
    const newBalanceUser1 = await amf.balanceOf(user1);
    const newBalancePool = await amf.balanceOf(tokenPool);
    assert.equal(newBalanceUser1.valueOf().toNumber(), tokenAmount1);
    assert.equal(newBalancePool.valueOf().toNumber(), tokenPoolInitialAmount-tokenAmount1);


    // DAY 2
    // user2 deposited  0.05 BTC at its local BTC wallet and transfered from it to AMFEIX.
    // User1 want its BTC back so he calls the claimBTC god.

    // updates ratio
    await amf.setSwapRatio(ratio2, { from: admin });
    const updatedRatio2 = await amf.getSwapRatio();
    assert.equal(updatedRatio2.valueOf().toNumber(), ratio2);

    // transfers from tokenPool to user2
    await amf.transfer(user2, tokenAmount2, { from: tokenPool })

    // checks user2 and admin new balances
    const newBalanceUser2 = await amf.balanceOf(user2);
    const newBalancePool2 = await amf.balanceOf(tokenPool);
    assert.equal(newBalanceUser2.valueOf().toNumber(), tokenAmount2);
    assert.equal(newBalancePool2.valueOf().toNumber(), newBalancePool-tokenAmount2);

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
  });
});
