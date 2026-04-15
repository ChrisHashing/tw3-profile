export interface ProfileData {
  displayName: string;
  githubName: string;
  evmAddress: string;
  signedAt: number;
}

export interface Profile {
  data: ProfileData;
  signature: string;
}

export interface SignResult {
  data: ProfileData;
  signature: string;
  address: string;
}
