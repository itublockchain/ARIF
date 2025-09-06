// Kontrat test scripti
// Bu dosyayı browser console'da çalıştır

// 1. Kontrat adresini kontrol et
console.log(
  "RequestBook Contract Address:",
  "0xc70Cfbddb71B7b5478C14384f6D98aa07e86fc18"
);

// 2. RISE testnet'e bağlan
console.log("RISE Testnet RPC:", "https://testnet.riselabs.xyz");

// 3. Test için gerekli bilgiler
const testData = {
  contractAddress: "0xc70Cfbddb71B7b5478C14384f6D98aa07e86fc18",
  rpcUrl: "https://testnet.riselabs.xyz",
  chainId: 11155931,
  // Test için bir ERC20 token adresi gerekli
  testUSDC: "0x0000000000000000000000000000000000000000", // Bu adresi gerçek bir USDC token ile değiştir
};

console.log("Test Data:", testData);

// 4. Kontrat fonksiyonlarını test et
async function testContract() {
  try {
    // Web3 provider'ı al
    const provider = window.ethereum;
    if (!provider) {
      console.error("MetaMask bulunamadı!");
      return;
    }

    // RISE testnet'e bağlan
    await provider.request({
      method: "wallet_switchEtherumChain",
      params: [{ chainId: "0xAA7A4D" }], // 11155931 in hex
    });

    console.log("RISE testnet'e bağlandı!");

    // Kontrat ABI'si
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

    // nextID'yi oku
    const nextID = await contract.methods.nextID().call();
    console.log("Next ID:", nextID);

    // Mevcut talepleri kontrol et
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
