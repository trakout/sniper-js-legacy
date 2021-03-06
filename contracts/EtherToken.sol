/*

  Copyright 2017 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.4.18;

import "./base/UnlimitedAllowanceToken.sol";
import "./base/SafeMath.sol";

contract EtherToken is UnlimitedAllowanceToken {

    string constant public name = "Wrapped Ether";
    string constant public symbol = "WETH";
    uint8 constant public decimals = 18;

    /// @dev Fallback to calling deposit when ether is sent directly to contract.
    function()
      public
      payable
    {
      deposit();
    }

    /// @dev Buys tokens with Ether, exchanging them 1:1.
    function deposit()
      public
      payable
    {
      balances[msg.sender] = SafeMath.add(balances[msg.sender], msg.value);
      totalSupply = SafeMath.add(totalSupply, msg.value);
    }

    /// @dev Sells tokens in exchange for Ether, exchanging them 1:1.
    /// @param amount Number of tokens to sell.
    function withdraw(uint amount)
      public
    {
      balances[msg.sender] = SafeMath.sub(balances[msg.sender], amount);
      totalSupply = SafeMath.sub(totalSupply, amount);
      require(msg.sender.send(amount));
    }
}
