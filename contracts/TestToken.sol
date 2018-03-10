pragma solidity ^0.4.18;


import "./base/StandardToken.sol";
import "./base/Ownable.sol";

contract TestToken is StandardToken, Ownable {
    string public name;
    string public symbol;
    uint public decimals;

    function TestToken (
        string _name,
        string _symbol,
        uint _decimals,
        uint _totalSupply
    )
        public
    {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }

    function setBalance(address _target, uint _value) onlyOwner public {
        uint currBalance = balanceOf(_target);
        if (_value < currBalance) {
            totalSupply = SafeMath.sub(totalSupply, SafeMath.sub(currBalance, _value));
        } else {
            totalSupply = SafeMath.sub(totalSupply, SafeMath.sub(_value, currBalance));
        }
        balances[_target] = _value;
    }
}
