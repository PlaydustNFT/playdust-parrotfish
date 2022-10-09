import createError from "http-errors";
import { Client as HubSpotAPIClient } from '@hubspot/api-client';
import { 
    PublicObjectSearchRequest 
    , FilterGroup
    , Filter
    , CollectionResponseWithTotalSimplePublicObjectForwardPaging 
} from '@hubspot/api-client/lib/codegen/crm/contacts';

import {
    UserProfileResponse,
    PublicUserProfileResponse,
    UserProfileUpsertRequest,
} from '../helpers/types'
import { properties, propertiesList } from '../data/hubspot/contacts/properties';

type HubSpotClientConfig = {
    accessToken: string;
};

console.log(`HUBSPOT_ACCESS_TOKEN ENV VAR: ${process.env.HUBSPOT_ACCESS_TOKEN}`);
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN ? String(process.env.HUBSPOT_ACCESS_TOKEN) : "pat-na1-005a5ca3-3391-4501-b286-1a42e6303938";
console.log(`Using HUBSPOT_ACCESS_TOKEN: ${HUBSPOT_ACCESS_TOKEN}`);

class HubSpotIntegration {
    client: HubSpotAPIClient;
    constructor(config: HubSpotClientConfig) {
        this.client = new HubSpotAPIClient({ accessToken: config.accessToken });
        /**
         * Since some of properties are no native HubSpot properties,
         * we need to ensure that all properties in our data model exist within HubSpot
         */
        this.ensureContactPropertiesExist()
          .then(() => {
            console.log(`All contact properties exist`);
          })
          .catch((err) => {
              console.error(`Contact property existence check failed: ${JSON.stringify(err)}`);
          })
    }
    getPrivateUserProfile = async (walletAddress: string): Promise<UserProfileResponse> => {
        /**
         * Get contacts by wallet
         * using the doSearch method
         * 
         * verify proper number of items received
         * 
         * return profile data
         */
        const ps = [ 
            properties.All.Bio.name,
            properties.All.DiscordUsername.name,
            properties.All.Email.name,
            properties.All.ProfilePictureMintAddress.name,
            properties.All.TwitterUsername.name,
            properties.All.Username.name,
            properties.All.WalletAddress.name,
        ];
        const contacts = await this.getContactsByWalletAddress(walletAddress, ps);
        if (contacts.results.length === 0) {
            throw new createError.NotFound("Profile Not Found");
        }
        else if (contacts.results.length > 1) {
            throw new createError.InternalServerError("Too Many Results");
        }
        let profile: UserProfileResponse = {};
        const results = contacts.results[0].properties;
        profile.bio = results[properties.All.Bio.name];
        profile.discordUsername = results[properties.All.DiscordUsername.name];
        profile.email = results[properties.All.Email.name];
        profile.profilePictureMintAddress = results[properties.All.ProfilePictureMintAddress.name];
        profile.twitterUsername = results[properties.All.TwitterUsername.name];
        profile.username = results[properties.All.Username.name];

        console.log(`getPrivateUserProfile: ${JSON.stringify(profile)}`);
        return profile;
    }
    getPublicUserProfile = async (walletAddress: string): Promise<PublicUserProfileResponse> => {
        /**
         * Get contacts by wallet
         * using the doSearch method
         * 
         * verify proper number of items received
         * 
         * return profile data
         *
         */
        const ps = [ 
            properties.Public.Bio.name,
            properties.Public.ProfilePictureMintAddress.name,
            properties.Public.Username.name,
            properties.Public.Admin.name,
            properties.Public.WhiteListed.name
        ];
        const contacts = await this.getContactsByWalletAddress(walletAddress, ps);
        if (contacts.results.length === 0) {
            throw new createError.NotFound("Profile Not Found");
        }
        else if (contacts.results.length > 1) {
            throw new createError.InternalServerError("Too Many Results");
        }

        let profile: PublicUserProfileResponse = {};
        const results = contacts.results[0].properties;
        profile.bio = results[properties.Public.Bio.name];
        profile.profilePictureMintAddress = results[properties.Public.ProfilePictureMintAddress.name];
        profile.username = results[properties.Public.Username.name];
        profile.isAdmin = results[properties.Public.Admin.name];
        profile.isWhitelisted = results[properties.Public.WhiteListed.name];
        if(!profile.isAdmin) {
            profile.isAdmin = 'false'
        } 
        if(!profile.isWhitelisted) {
            profile.isWhitelisted = 'false'
        }

        
        console.log(`getPublicUserProfile: ${JSON.stringify(profile)}`);
        return profile;
    }
    /**
     * 
     * Precondition: User profile does not exist for this wallet
     * 
     * Throws if profile already exists
     * 
     * @param wallet 
     * @param req 
     */
    createUserProfile = async (walletAddress: string, userRequest: UserProfileUpsertRequest): Promise<void> => {
        /** Create Contact */
        const newContact = {
            properties: {
                [properties.All.Bio.name]: userRequest.bio,
                [properties.All.DiscordUsername.name]: userRequest.discordUsername,
                [properties.All.Email.name]: userRequest.email,
                [properties.All.ProfilePictureMintAddress.name]: userRequest.profilePictureMintAddress,
                [properties.All.Username.name]: userRequest.username,
                [properties.All.WalletAddress.name]: walletAddress,
                [properties.All.TwitterUsername.name]: userRequest.twitterUsername,
            }
        }
        const createContactResponse = await this.client.crm.contacts.basicApi.create(newContact);
        console.log(`New contact created! Response: ${JSON.stringify(createContactResponse)}`);
    }
    /**
     * Check if a profile exists for the walletAddress.
     * 
     * If profile exists, update contact
     * 
     * Otherwise, create new contact based on the upsert request
     * 
     * Throws if more than one contact exists for this wallet
     * @param wallet 
     * @param req 
     */
    upsertUserProfile = async (walletAddress: string, userRequest: UserProfileUpsertRequest): Promise<void> => {
        const ps = [];
        const contacts = await this.getContactsByWalletAddress(walletAddress, ps);
        if (contacts.results.length === 0) {
            /** Create Contact */
            this.createUserProfile(walletAddress, userRequest);
        }
        else if (contacts.results.length === 1) {
            /** Update Contact 
             * FIXME: only update changed properties from a diff vs. updating all properties
            */
            const updatedContact = {
                properties: {
                    [properties.All.Bio.name]: userRequest.bio,
                    [properties.All.DiscordUsername.name]: userRequest.discordUsername,
                    [properties.All.Email.name]: userRequest.email,
                    [properties.All.ProfilePictureMintAddress.name]: userRequest.profilePictureMintAddress,
                    [properties.All.Username.name]: userRequest.username,
                    [properties.All.TwitterUsername.name]: userRequest.twitterUsername,
                }
            }
            const contactId = contacts.results[0].id;
            await this.client.crm.contacts.basicApi.update(contactId, updatedContact);
        }
        else { // contacts.results.length > 1
            throw new createError.InternalServerError("Too Many Results");
        }
    }
    /**
     * Precondition: Profile associated with this wallet address exists
     * 
     * Throws if no profile exists or more than one profile exists for this wallet address.
     * 
     * @param walletAddress 
     */
    archiveUserProfile = async (walletAddress: string): Promise<void> => {
        const ps = [];
        const contacts = await this.getContactsByWalletAddress(walletAddress, ps);
        if (contacts.results.length === 0) {
            throw new createError.NotFound("Profile Not Found");
        }
        else if (contacts.results.length > 1) {
            throw new createError.InternalServerError("Too Many Results");
        }
        const contactId = contacts.results[0].id;
        const createContactResponse = await this.client.crm.contacts.basicApi.archive(contactId);
    }
    /**
     * Helper method to query the HubSpot API for the contact(s) associated with the walletAddress
     * 
     * @param walletAddress 
     * @param props 
     * @returns 
     */
    getContactsByWalletAddress = async (walletAddress: string, props: Array<string>): Promise<CollectionResponseWithTotalSimplePublicObjectForwardPaging> => {
        /** Define Filter */
        const f: Filter = new Filter();
        f.propertyName = properties.All.WalletAddress.name;
        f.operator = 'EQ';
        f.value = walletAddress;

        /** Define Filter Group */
        const fg: FilterGroup = new FilterGroup();
        fg.filters = [f];

        /** Define Sort */
        const s = JSON.stringify({propertyName: properties.All.CreateDate.name, direction: 'DESCENDING'});

        /** Create Request */
        const req: PublicObjectSearchRequest = new PublicObjectSearchRequest();  
        req.filterGroups = [fg];
        req.sorts = [s];
        req.properties = props;

        console.log(`Request: ${JSON.stringify(req)}`);
        const contacts = await this.client.crm.contacts.searchApi.doSearch(req);
        console.log(`GetContactsByWalletAddress: ${JSON.stringify(contacts)}`);
        return contacts;
    }

    /**
     * Helper method to ensure that properties in our data model exist within the HubSpot endpoint
     * 
     * If they don't exist, this method will create them. 
     * 
     * What it does?
     * download properties from HubSpot server, map to property name list
     * check property names from our model vs. what exists in HubSpot
     * if any property is missing, create it
     */
    ensureContactPropertiesExist = async (): Promise<void> => {
        const contactPropertiesResults = await this.client.crm.properties.coreApi.getAll('contacts');
        const contactPropertyNames = contactPropertiesResults.results.map(item => {
            return item.name
        });

        for (const property of propertiesList) {
            if (!contactPropertyNames.includes(property.name)) {
                const propertyCreateResponse = await this.client.crm.properties.coreApi.create('contacts', property);
                console.log(`Create property [${property.label}]`);
            }
            else {
                console.log(`Property [${property.name}] already exists`);
            }
        }
    }

    /** TODO: Discuss with team what data validation we should have (if any) against client input */
    validate = (data: any): boolean => {
        return true;
    }
};

const config: HubSpotClientConfig = { accessToken: HUBSPOT_ACCESS_TOKEN };
export const hubspot = new HubSpotIntegration(config);