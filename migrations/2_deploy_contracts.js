
const AMF = artifacts.require("AMF");

module.exports = async function (deployer) {
  await deployer.deploy(AMF, 'AMFEIX', 'AMF', '0x9BA7e8511Cf17AEfc3Cc8eaf8193bF589D2Dd1B8', 'mxA8LEkapbmkftErogdJmLvp69BtTNJeGU');
};