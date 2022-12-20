//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	uint256 public orderCount;

	mapping(address => mapping(address => uint256)) public tokens;
	mapping(uint256 => _Order) public orders;
	mapping(uint256 => bool) public orderCancelled;
	mapping(uint256 => bool) public orderFilled;

	event Deposit
		(address token,
		address user,
		uint256 amount,
		uint256 balance);

	event Withdraw
		(address token,
		address user,
		uint256 amount,
		uint256 balance);

	event Order
		(uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp);

	event Cancel
		(uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp);

	event Trade
		(uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		address creator,
		uint256 timestamp);	

	struct _Order {
		//Attributes of an order
		uint256 id; //Uinque identifier for order
		address user; //User who made the order
		address tokenGet; //Address of the token user will receive
		uint256 amountGet; //Amount user will receive
		address tokenGive; //Address of token user will give
		uint256 amountGive; //Amount user will give
		uint256 timestamp; //When the order was created
	}		

	constructor(address _feeAccount, uint256 _feePercent) {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}

	/*-----------------------
	 DEPOSIT & WITHDRAW TOKEN
	-----------------------*/

	function depositToken(address _token, uint256 _amount) public {
		//Transfer tokens to exchange
		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
		//Update user balance
		tokens[_token][msg.sender] += _amount;
		//Emit an event
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function withdrawToken(address _token, uint256 _amount) public {
		//Ensure enough tokens to withdraw
		require(tokens[_token][msg.sender] >= _amount);
		//Transfer tokens to exchange & update user balance
		Token(_token).transfer(msg.sender, _amount);
		tokens[_token][msg.sender] -= _amount;
		//Emit an event
		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function balanceOf(address _token, address _user) public view returns(uint256) {
		return tokens[_token][_user];
	}

	/*------------------
	 MAKE & CANCEL TOKEN
	------------------*/

	function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
		//Prevent orders if tokens arent on the exchange
		require(balanceOf(_tokenGive, msg.sender) >= _amountGive);
		//Istantiate new Order
		orderCount ++;
		orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
		//Emit Event
		emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
	}

	function cancelOrder(uint256 _id) public {
		//Fetch order
		_Order storage _order = orders[_id];
		//Ensure the caller of the function is the owner of the order & Order must exist
		require(address(_order.user) == msg.sender);
		require(_order.id == _id);
		//Cancel order
		orderCancelled[_id] = true;
		//Emit an order
		emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, block.timestamp);
	}

	/*---------------
	 EXECUTING ORDERS
	---------------*/

	function fillOrder(uint256 _id) public {
		//Must be a valid orderID, Order cant be filled & Order cant be cancelled
		require(_id > 0 && _id <= orderCount, "Order does not exist");
		require(!orderFilled[_id]);
		require(!orderCancelled[_id]);
		//Fetch order
		_Order storage _order = orders[_id];
		//Execute the trade
		_trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
		//Mark order as filled
		orderFilled[_order.id] = true;
	}

	function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
		//Fee is deducted from _amountGet
		uint256 _feeAmount = (_amountGet * feePercent) / 100;
		//msg.sender is the user who filled the order, ehile _user is who created the order
		tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount); //Fee is paid by the user who filled the order (msg.sender)
		tokens[_tokenGet][_user] += _amountGet;
		//Charge Fee
		tokens[_tokenGet][feeAccount] += _feeAmount;

		tokens[_tokenGive][_user] -= _amountGive;
		tokens[_tokenGive][msg.sender] += _amountGive;
		//Emit Trade Event
		emit Trade(_orderId, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, _user, block.timestamp);
	}
}
