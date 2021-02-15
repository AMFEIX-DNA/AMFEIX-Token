
const AMF = artifacts.require("AMF");

module.exports = async function (deployer) {
  await deployer.deploy(AMF, 'AMFEIX', 'AMF');
};