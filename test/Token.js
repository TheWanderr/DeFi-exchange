const { expect } = require('chai');
const { ethers } = require('hardhat');
const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), 'ether');
}

describe('Token', () => {
	let token,
		accounts,
		deployer,
		receiver,
		exchange;


	beforeEach(async () => {
		//Fetch token from blockchain
		const Token = await ethers.getContractFactory('Token');
		token = await Token.deploy('CoboltBlu', 'BLU', '1000000');

		accounts = await ethers.getSigners();
		deployer = accounts[0];
		receiver = accounts[1];
		exchange = accounts[2];
	})

	describe('Depolyment', () => {
		const name = 'CoboltBlu';
		const symbol = 'BLU';
		const decimals = '18';
		const totalSupply = tokens('1000000');



		it('Has the correct name', async () => {
			//Check that name is correct
			expect(await token.name()).to.equal(name);
		})

		it('Has the correct symbol', async () => {
			//Check that symbol is correct
			expect(await token.symbol()).to.equal(symbol);
		})

		it('Has the correct number of decimals', async () => {
			//Check that decimals are correct
			expect(await token.decimals()).to.equal(decimals);
		})

		it('Has the correct total supply', async () => {
			//Check that total supply is correct
			expect(await token.totalSupply()).to.equal(totalSupply);
		})

		it('Assigns the total supply to the deployer', async () => {
			expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
		})
	})

	describe('Sending Tokens', () => {
		let amount,
			Transaction,
			result;

		describe('Success', () => {
			beforeEach(async () => {
				amount = tokens("100");
				//Transfer Tokens
				transaction = await token.connect(deployer).transfer(receiver.address, amount);
				result = await transaction.wait();
			})

			it ('transfers the token balances correctly', async () => {
				//Ensure that the tokens were transfered and the balance was changed
				expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
				expect(await token.balanceOf(receiver.address)).to.equal(amount);
			})

			it ('emits a Transfer event', async () => {
				const eventLog = result.events[0];
				const args = eventLog.args;

				expect(eventLog.event).to.equal('Transfer');
				expect(args.from).to.equal(deployer.address);
				expect(args.to).to.equal(receiver.address);
				expect(args.value).to.equal(amount);
			})
		})

		describe('Failure', () => {
			it ('rejects insufficient balances', async () => {
				//transfer more tokens than the deployer has
				const invalidAmount = tokens(100000000);
				await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted;
			})

			it('rejects invalid recipent', async () => {
				const amount = tokens(100);
				await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000', amount)).to.be.reverted;
			})
		})
	})

	describe('Approving Tokens', () => {
		let amount,
			transaction,
			result;

		beforeEach(async () => {
			amount = tokens(100);
			transaction = await token.connect(deployer).approve(exchange.address, amount);
			result = await transaction.wait();
		})

		describe('Success', () => {
			it('allocates an allowance for delegated token spending', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount);
			})

			it ('emits a Approval event', async () => {
				const eventLog = result.events[0];
				const args = eventLog.args;

				expect(eventLog.event).to.equal('Approval');
				expect(args.owner).to.equal(deployer.address);
				expect(args.spender).to.equal(exchange.address);
				expect(args.value).to.equal(amount);
			})
		})

		describe('Failure', () => {
			it('rejects invalid spenders', async () => {
				const amount = tokens(100);
				await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000', amount)).to.be.reverted;
			})
		})
	})

	describe('Delegated Token Transfers', () => {
		let amount,
			transaction,
			result;

		beforeEach(async () => {
			amount = tokens(100);
			transaction = await token.connect(deployer).approve(exchange.address, amount);
			result = await transaction.wait();
		})

		describe('Success', () => {
			beforeEach(async () => {
				transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount);
				result = await transaction.wait();
			})

			it('transfers token balances', async () => {
				expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits('999900', 'ether'));
				expect(await token.balanceOf(receiver.address)).to.be.equal(amount);
			})

			it('resets the allowance', async () => {
				expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0);
			})

			it ('emits a Transfer event', async () => {
				const eventLog = result.events[0];
				const args = eventLog.args;

				expect(eventLog.event).to.equal('Transfer');
				expect(args.from).to.equal(deployer.address);
				expect(args.to).to.equal(receiver.address);
				expect(args.value).to.equal(amount);
			})
		})

		describe('Failure', () => {
			it('Rejects insufficient amounts', async () => {
				const invalidAmount = tokens(100000000);
				await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted;
			})
		})
	})
})
