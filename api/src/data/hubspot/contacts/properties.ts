import { PropertyCreate } from '@hubspot/api-client/lib/codegen/crm/properties';

const WalletAddress: PropertyCreate = {
    name: "pd_walletaddress",
    label: "Wallet Address", 
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description: "A contact's wallet address public key"
};
const Username: PropertyCreate = {
    name : "pd_username",
    label : "User Name",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "A contact's Playdust username",
};
const Email: PropertyCreate = {
    name : "email",
    label : "Email",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "A contact's email address",
};
const Bio: PropertyCreate = {
    name : "pd_bio",
    label : "Bio",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "A contact's bio",
};
const DiscordUsername: PropertyCreate = {
    name : "pd_discordusername",
    label : "Discord User Name",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "A contact's discord username",
};
const TwitterUsername: PropertyCreate = {
    name : "twitterhandle",
    label : "Twitter User Name",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "A contact's twitter handle",
};
const ProfilePictureMintAddress: PropertyCreate = {
    name : "pd_profilepicturemintaddress",
    label : "Profile Picture Mint Address",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "A contact's profile picture's token mint address",
};
const Admin: PropertyCreate = {
    name : "pd_admin",
    label : "Admin flag",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "Property describing if a user is Admin",
};
const Whitelisted: PropertyCreate = {
    name : "pd_whitelisted",
    label : "Whitelist flag",
    type : "string",
    fieldType : "text",
    groupName : "contactinformation",
    description : "Property describing if a user is in whitelist",
};
const CreateDate = {
    name : "createdate",
    label : "Create date",
};

export const properties = {
    All: {
        WalletAddress: WalletAddress,
        Username: Username,
        Email: Email,
        Bio: Bio,
        DiscordUsername: DiscordUsername,
        TwitterUsername: TwitterUsername,
        ProfilePictureMintAddress: ProfilePictureMintAddress,
        CreateDate: CreateDate,
    },
    Public: {
        Username: Username,
        Bio: Bio,
        ProfilePictureMintAddress: ProfilePictureMintAddress,
        WhiteListed: Whitelisted,
        Admin: Admin
    }
};

export const propertiesList = [
    WalletAddress,
    Username,
    Email,
    Bio,
    DiscordUsername,
    TwitterUsername,
    ProfilePictureMintAddress,
    Admin,
    Whitelisted,
];
