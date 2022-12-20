async function main() {
  console.log(`Preparing deployment...\n`)
  // Fetch contract to deploy
  const Token = await ethers.getContractFactory('Token');
  const Exchange = await ethers.getContractFactory('Exchange');
  //Fetch account
  const accounts = await ethers.getSigners()
  console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`)
  // Deploy contract
  const blu = await Token.deploy('CoboltBlu', "BLU", '1000000');
  await blu.deployed();
  console.log(`BLU deployed to ${blu.address}`);

  const mETH = await Token.deploy('mETH', 'mETH', '1000000');
  await mETH.deployed();
  console.log(`mETH deployed to ${mETH.address}`);

  const cusd = await Token.deploy('Cobolt USD', "CUSD", '1000000');
  await cusd.deployed();
  console.log(`CUSD deployed to ${cusd.address}`);

  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange deployed to: ${exchange.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });