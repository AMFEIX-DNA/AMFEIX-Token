pragma solidity >=0.4.25 <=0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/AMF.sol";

contract TestAMF {

  function testInitialBalanceUsingDeployedContract() public {
    AMF amf = AMF(DeployedAddresses.AMF());

    uint expected = 0;

    Assert.equal(amf.balanceOf(tx.origin), expected, "Owner should have 0 AMF coin initially");
  }

}
