const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChain } = require("../../helper-hardhat-config")

developmentChain.includes(network.name)
    ? //functions under describe should not be async
      describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") //value of 1 ether is stored in the sendValue variable

          beforeEach(async function () {
              // const accounts = getSigners()
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          /**@notice This describe statement tests the constructor in the FundMe contract */
          describe("constructor", function () {
              it("sets the aggregator addresses conrrectly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          /**@notice This describe statement tests the fund function in the FundMe contract */
          describe("fund", function () {
              it("fails if not enough ETH is sent", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough!"
                  )
              })
              it("adds funder to funder's array", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunders(0)
                  assert.equal(response, deployer)
              })
              it("updates amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
          })
          /**@notice This describe statement tests the withdraw function in the FundMe contract */
          describe("withdraw", function () {
              // to fund function with eth
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString() /**@notice add function makes it easier for adding big numbers */,
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allows us to withdraw with multiple funders", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  ) /**@notice add function makes it easier for adding big numbers */

                  //Check if funders array is reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__notTheOwner")
              })

              it("cheaperWithdraw test (single funder)", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString() /**@notice add function makes it easier for adding big numbers */,
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("cheaperWithdraw test (multi-funder)", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  ) /**@notice add function makes it easier for adding big numbers */

                  //Check if funders array is reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
    : describe.skip
