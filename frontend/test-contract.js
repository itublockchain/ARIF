// Contract test script
// Run this file in browser console

// 1. Check contract address
console.log(
  "RequestBook Contract Address:",
  "0xc70Cfbddb71B7b5478C14384f6D98aa07e86fc18"
);

// 2. Connect to RISE testnet
console.log("RISE Testnet RPC:", "https://testnet.riselabs.xyz");

// 3. Required information for testing
const testData = {
  contractAddress: "0xc70Cfbddb71B7b5478C14384f6D98aa07e86fc18",
  rpcUrl: "https://testnet.riselabs.xyz",
  chainId: 11155931,
  // An ERC20 token address is required for testing
  testUSDC: "0x0000000000000000000000000000000000000000", // Replace this address with a real USDC token
};

console.log("Test Data:", testData);

// 4. Test contract functions
async function testContract() {
  try {
    // Get Web3 provider
    const provider = window.ethereum;
    if (!provider) {
      console.error("MetaMask not found!");
      return;
    }

    // Connect to RISE testnet
    await provider.request({
      method: "wallet_switchEtherumChain",
      params: [{ chainId: "0xAA7A4D" }], // 11155931 in hex
    });

    console.log("Connected to RISE testnet!");

    // Contract ABI
    const contractABI = [
      {
        inputs: [],
        name: "nextID",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "borrowID", type: "uint256" },
        ],
        name: "getBorrowRequest",
        outputs: [
          {
            components: [
              { internalType: "uint256", name: "id", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              { internalType: "address", name: "borrower", type: "address" },
              {
                internalType: "address",
                name: "assetERC20Address",
                type: "address",
              },
            ],
            internalType: "struct RequestBook.BorrowRequest",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];

    // Web3 instance oluştur
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(
      contractABI,
      testData.contractAddress
    );

    // Read nextID
    const nextID = await contract.methods.nextID().call();
    console.log("Next ID:", nextID);

    // Check existing requests
    for (let i = 0; i < nextID; i++) {
      try {
        const request = await contract.methods.getBorrowRequest(i).call();
        console.log(`Request ${i}:`, request);
      } catch (error) {
        console.log(`Request ${i}: Does not exist`);
      }
    }
  } catch (error) {
    console.error("Test hatası:", error);
  }
}

// Test fonksiyonunu çalıştır
testContract();
