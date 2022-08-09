// to make sure everything is (approximately)working on a testnet.
// last test before final deployment

const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChain } = require("../../helper-hardhat-config")

developmentChain.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.01")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(
                  endingBalance.toString(),
                  ethers.utils.parseEther("0")
              )
          })
      })
