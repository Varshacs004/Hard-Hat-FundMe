//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConvertor {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        //the address below is from site:- https://docs.chain.link/docs/ethereum-addresses/
        //ETH / USD addr = 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e (Rinkby Testnet).

        (, int256 price, , , ) = priceFeed.latestRoundData();
        //latestRoundData() returns a lot of things and we want only 1 value.
        //The rest of the them are just denoted by commas.
        //this returns price of eth in USD.
        //the returned value will have 8 decimal spaces.

        return uint256(price * 1e10); //10^10

        //we use uint256(...) to typecase to uint256.
    }

    // function getVersion() internal view returns (uint256) {
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(
    //         0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
    //     );
    //     return priceFeed.version();
    // }

    function getConversionRate(uint256 ethAmt, AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmtInUSD = (ethPrice * ethAmt) / 1e18;
        return ethAmtInUSD;
    }
}
