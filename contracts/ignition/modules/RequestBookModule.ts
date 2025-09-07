import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RequestBookModule = buildModule("RequestBookModule", (m) => {
  const requestBook = m.contract("RequestBook", []);

  return { requestBook };
});

export default RequestBookModule;