import { ReclaimProofRequest, verifyProof, ClaimCreationType } from "@reclaimprotocol/js-sdk";

const appId = process.env.RECLAIM_APP_ID;
const appSecret = process.env.RECLAIM_APP_SECRET;

const BASE_URL = process.env.BASE_URL;

async function createClaimRequest() {
    const reclaimProofRequest = await ReclaimProofRequest.init(appId, appSecret, "papara-balance");
    reclaimProofRequest.setAppCallbackUrl(BASE_URL+'/receive-proofs')

    const reclaimProofRequestConfig = reclaimProofRequest.toJsonString()
}

createClaimRequest();