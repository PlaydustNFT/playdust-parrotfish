export type UserFlag = {
  wallet: string;
  reason?: string;
  datetime: string; // hack around ddb's limited support for dates here; could convert to number
};

export type StaleFlag = {
  datetime: string;
};

export type CensorData = {
  severity: string;
  wallet: string;
  datetime: string;
};

export type PublicUserProfileResponse = {
  username?: string;
  bio?: string;
  profilePictureMintAddress?: string;
  isWhitelisted?: string;
  isAdmin?: string;
};

export type UserProfileResponse = {
  username?: string;
  email?: string;
  bio?: string;
  twitterUsername?: string;
  discordUsername?: string;
  profilePictureMintAddress?: string;
};

export type UserProfileUpsertRequest = {
  username?: string;
  email?: string;
  bio?: string;
  twitterUsername?: string;
  discordUsername?: string;
  profilePictureMintAddress?: string;
};