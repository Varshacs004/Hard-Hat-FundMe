// function deployFunction(hre) {
//     hre.getNamedAccounts()
//     hre.deployments
// }

// module.exports.default = deployFunction

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
// }

const { network } = require("hardhat")

const { networkConfig, developmentChain } = require("../helper-hardhat-config")
//      (or)
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //const ethUSDPriceFeedAddress = networkConfig[chainId]["ethUSDPriceFeed"]
    let ethUSDPriceFeedAddress
    if (developmentChain.includes(network.name)) {
        //if ((chainId = 31337)) {
        const ethUSDAggregator = await deployments.get("MockV3Aggregator")
        ethUSDPriceFeedAddress = ethUSDAggregator.address
    } else {
        ethUSDPriceFeedAddress = networkConfig[chainId]["ethUSDPriceFeed"]
    }

    const args = [ethUSDPriceFeedAddress]

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put price feed address.
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChain.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("-------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
