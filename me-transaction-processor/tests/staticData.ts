import { 
    CompiledInstruction, 
    LAMPORTS_PER_SOL, 
    PublicKey,
} from "@solana/web3.js"
import { Marketplace, MarketplaceInstructionType, MarketplaceTransactionEntityData, ParseableTransaction } from "../../shared/src/types";

const GenerateTransactionStaticDataForTesting = (transactionData: any): ParseableTransaction => {
    return new ParseableTransaction(transactionData);
};

export const InstructionIndex = {
    Ask: 0,
    Bid: 0,
    CancelAsk: 0,
    CancelBid: 0,
    ExecuteSale: 2,
}

export const BidTx: any = JSON.parse('{"blockTime":1650391361,"meta":{"err":null,"fee":5000,"innerInstructions":[{"index":0,"instructions":[{"accounts":[0,2],"data":"11112nba6qLH4BKL4MW8GP9ayKApZeYn3LQKJdPdeSXbRW1n6UPeJ8y77ps6sAVwAjdxzh","programIdIndex":3}]}],"postBalances":[1202098847,26500000000,2011440,1,1461600,5616720,100142593680,3654000,953185920,1009200,1141440],"postTokenBalances":[],"preBalances":[1204115287,26500000000,0,1,1461600,5616720,100142593680,3654000,953185920,1009200,1141440],"preTokenBalances":[],"rewards":[],"status":{"Ok":null}},"slot":130450824,"transaction":{"message":{"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":8,"numRequiredSignatures":1},"accountKeys":["3AE4BC9fZZztj4Rxj7bG9CxvySa8rembN4rREmx5kYaq","BqzHF9qnNeMCtNhEgTD3yzryHfbWvfdxgRUHnaE65TZg","Cf27HFWwjcao4oHGrtvuZ9GLk31aR7b9NKWjLCet85VB","11111111111111111111111111111111","2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","CCFLUrEwkS9rZ2Kr7UDZTAjZT5EKpF7Uae9uQZ1Xm8ci","autMW8SgBkVYeBgqYiTuJZnkvDZMVU2MHJh9Jh7CSQ2","E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","SysvarRent111111111111111111111111111111111","M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"],"recentBlockhash":"ATSHu2McyvgJ6Qsw6KHx4L1gNvV2oFsDuR1vekEGNTum","instructions":[{"accounts":[0,3,4,5,1,6,7,2,6,8,3,9],"data":"3Jmjmsq2jyrch4vKPxsWiSHEhvkJuVSqtVG7k3emXn8bzCX","programIdIndex":10}],"indexToProgramIds":{}},"signatures":["3buqku3ZkWCyssxtBNnsoNMAKUF2ibcoRwgj4h3T9RznK5rd1MJyVNS5EnwLxUiQUS9q3HanspMCiQBwtYX9oRTJ"]}}');
export const BidTransactionStaticData: ParseableTransaction =  GenerateTransactionStaticDataForTesting(BidTx);

export const CancelBidTx: any = JSON.parse('{"blockTime":1650409767,"meta":{"err":null,"fee":5000,"innerInstructions":[],"logMessages":["Program M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K invoke [1]","Program log: Instruction: CancelBuy","Program M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K consumed 13582 of 200000 compute units","Program M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K success"],"postBalances":[116454355001,1461600,0,1,100142593680,3654000,1141440],"postTokenBalances":[],"preBalances":[116452348561,1461600,2011440,1,100142593680,3654000,1141440],"preTokenBalances":[],"rewards":[],"status":{"Ok":null}},"slot":130478707,"transaction":{"message":{"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":4,"numRequiredSignatures":1},"accountKeys":["9ifYfq1ynVX9B4nyCgb1dW1pTs9EVjdN7RfFn5CoQbJP","2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","8Hz4npJeUeN3EYmQ2soAbtFHfpLPnAwFNTDX6yrtRHg5","11111111111111111111111111111111","autMW8SgBkVYeBgqYiTuJZnkvDZMVU2MHJh9Jh7CSQ2","E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe","M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"],"recentBlockhash":"9dmVNpJYsshWugphhfnsYvPjUEpLJ6oAP5cpzvZmDFaX","instructions":[{"accounts":[0,3,1,4,5,2,4],"data":"H3DNhiDSYtdPoobkW2b6MssQnWoLkJapvLCb986A96ab","programIdIndex":6}],"indexToProgramIds":{}},"signatures":["49vcHjB6sn2A6XZYMGHuhSpesPPsY9YUTLwREfEhwCaMnfEo6ws1reCAWxZSY8vjUmNHniYSoxFDwiQiK8Fo9GBC"]}}');
export const CancelBidTransactionStaticData: ParseableTransaction = GenerateTransactionStaticDataForTesting(CancelBidTx);

export const AskTx: any = JSON.parse('{"blockTime":1650241667,"meta":{"err":null,"fee":5000,"innerInstructions":[{"index":0,"instructions":[{"accounts":[0,2],"data":"11112mKM3DB7QNzHW7AUJvvn8NrMPb3fbVjgauNqV6TRAwnRZVgyZQQA1s1hFiKL92AcER","programIdIndex":3},{"accounts":[1,0],"data":"bmawjv4rJea976wGPmMx1G5saPmQJ2i6VZAcVNYph9kyoRr","programIdIndex":8}]}],"postBalances":[54152986517,2039280,2234160,1,1461600,5616720,100142603680,3654000,953185920,898174080,101184828871,1009200,1141440],"postTokenBalances":[{"accountIndex":1,"mint":"2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","owner":"1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix","uiTokenAmount":{"amount":"1","decimals":0,"uiAmount":1,"uiAmountString":"1"}}],"preBalances":[54155225677,2039280,0,1,1461600,5616720,100142603680,3654000,953185920,898174080,101184828871,1009200,1141440],"preTokenBalances":[{"accountIndex":1,"mint":"2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","owner":"4zhA8DihD59LuTELo63GnF4f6iQ33wNNzu7pPeCQTJfQ","uiTokenAmount":{"amount":"1","decimals":0,"uiAmount":1,"uiAmountString":"1"}}],"rewards":[],"status":{"Ok":null}},"slot":130207906,"transaction":{"message":{"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":10,"numRequiredSignatures":1},"accountKeys":["4zhA8DihD59LuTELo63GnF4f6iQ33wNNzu7pPeCQTJfQ","5Z5iqQcK3HG6sZ7PsmaRVRyc15Yi7dj5yFJzMDnxx1pF","4BbmHeEXpGq1bF2vTmD6kYFbJ1r4RDwZa21faYR2E6ky","11111111111111111111111111111111","2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","CCFLUrEwkS9rZ2Kr7UDZTAjZT5EKpF7Uae9uQZ1Xm8ci","autMW8SgBkVYeBgqYiTuJZnkvDZMVU2MHJh9Jh7CSQ2","E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix","SysvarRent111111111111111111111111111111111","M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"],"recentBlockhash":"9rJBydQ2vKvprsWcW9EYLRc1mrjCWzSVxLyXaSfojuxB","instructions":[{"accounts":[0,3,1,1,4,5,6,7,2,6,8,3,9,10,11],"data":"2B3vSpRNKZZWu2TaB88q6j43gK6KgSotuteyZfbCEXHp6Le","programIdIndex":12}],"indexToProgramIds":{}},"signatures":["2vcGHjDHwczGKp4A32QPY4PJzts6tRpjatpeUsZSoe39cgyiEvnLVitrDYPi5fJTCDPZ3yTdDf7hBiGUE7U3qn1t"]}}');
export const AskTransactionStaticData: ParseableTransaction =  GenerateTransactionStaticDataForTesting(AskTx);

export const CancelAskTx: any = JSON.parse('{"blockTime":1645985636,"meta":{"err":null,"fee":5000,"innerInstructions":[{"index":0,"instructions":[{"accounts":[1,3],"data":"bmb6NwQE1TKTAmKKpE7vzA7V2hG8A7JcBpUnbGHm2R1rTnw","programIdIndex":8}]}],"logMessages":["Program M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K invoke [1]","Program log: Instruction: CancelSell","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]","Program log: Instruction: SetAuthority","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1770 of 176721 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K consumed 26731 of 200000 compute units","Program M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K success"],"postBalances":[6679306332,2039280,0,39088957046,1,1461600,100148958680,3654000,953185920,1141440],"postTokenBalances":[{"accountIndex":1,"mint":"2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","owner":"9eCrHbaDEc4KHKEh8ZVVMtMwbiDPJnHBzN4fSLnMEt63","uiTokenAmount":{"amount":"1","decimals":0,"uiAmount":1,"uiAmountString":"1"}}],"preBalances":[6677077172,2039280,2234160,39088957046,1,1461600,100148958680,3654000,953185920,1141440],"preTokenBalances":[{"accountIndex":1,"mint":"2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","owner":"1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix","uiTokenAmount":{"amount":"1","decimals":0,"uiAmount":1,"uiAmountString":"1"}}],"rewards":[],"status":{"Ok":null}},"slot":122747697,"transaction":{"message":{"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":6,"numRequiredSignatures":1},"accountKeys":["9eCrHbaDEc4KHKEh8ZVVMtMwbiDPJnHBzN4fSLnMEt63","5kTF93tzRzFaB2pQ4kcQa9r1csu6v32rB896tXCX5mp9","35n11CyfchGtaeFNP64zkaSAh9fpr1aBAx8MaJcDiZJ2","1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix","11111111111111111111111111111111","2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","autMW8SgBkVYeBgqYiTuJZnkvDZMVU2MHJh9Jh7CSQ2","E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"],"recentBlockhash":"1BwF8rWDKcXKSHpS67onH2T1vVCAX5NKy9uPcWioygy","instructions":[{"accounts":[0,4,1,5,6,7,2,6,8,3],"data":"ENwHiaH9NA9vgLej1ffGNeX5CQUgU4D7HjpuaPRK2z46","programIdIndex":9}],"indexToProgramIds":{}},"signatures":["25rhoCVE1fLK6pRWuCNxQ1JC7UJMVBNTj4d8u4LtvNR36JLY1hDfKr7CFEniLd2ssFGrHRjwFvrY4EcMtrqMdcGF"]}}');
export const CancelAskTransactionStaticData: ParseableTransaction =  GenerateTransactionStaticDataForTesting(CancelAskTx);

export const ExecuteSaleTx: any = JSON.parse('{"blockTime":1650455042,"meta":{"err":null,"fee":5000,"innerInstructions":[{"index":0,"instructions":[{"accounts":[0,1],"data":"3Bxs3zs5L8BZFuzP","programIdIndex":10}]},{"index":1,"instructions":[{"accounts":[0,3],"data":"11112nba6qLH4BKL4MW8GP9ayKApZeYn3LQKJdPdeSXbRW1n6UPeJ8y77ps6sAVwAjdxzh","programIdIndex":10}]},{"index":2,"instructions":[{"accounts":[1,9],"data":"3Bxs4NGS7mU9MM43","programIdIndex":10},{"accounts":[1,7],"data":"3Bxs3zzSZtG5ywFV","programIdIndex":10},{"accounts":[1,4],"data":"3Bxs4NJhp2HJFHSP","programIdIndex":10},{"accounts":[0,6,0,12,10,14,15],"data":"","programIdIndex":16},{"accounts":[0,6],"data":"11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL","programIdIndex":10},{"accounts":[6,12],"data":"6Yxy6utiDcHxBKEmfkbDi1HYLt2opsMWNKwZk3kS4ErW6","programIdIndex":14},{"accounts":[5,6,17],"data":"3DdGGhkhJbjm","programIdIndex":14},{"accounts":[5,4,17],"data":"A","programIdIndex":14}]}],"postBalances":[43646480550,0,100142583680,0,34168645797,0,2039280,725642624390,0,155657235880,1,3654000,1461600,5616720,953185920,1009200,853073280,103965363566,1141440],"postTokenBalances":[{"accountIndex":6,"mint":"2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","owner":"CqGRyhBRKSgM3kg9fS2NXK6xP9E1TcEfd2PtZAkEwi58","uiTokenAmount":{"amount":"1","decimals":0,"uiAmount":1,"uiAmountString":"1"}}],"preBalances":[76648524830,0,100142583680,0,3474372357,2039280,0,724982624390,2234160,154007235880,1,3654000,1461600,5616720,953185920,1009200,853073280,103965363566,1141440],"preTokenBalances":[{"accountIndex":5,"mint":"2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","owner":"1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix","uiTokenAmount":{"amount":"1","decimals":0,"uiAmount":1,"uiAmountString":"1"}}],"rewards":[],"status":{"Ok":null}},"slot":130552300,"transaction":{"message":{"header":{"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":9,"numRequiredSignatures":1},"accountKeys":["CqGRyhBRKSgM3kg9fS2NXK6xP9E1TcEfd2PtZAkEwi58","863zJW4yQ41UUR48MfWFu2JLL7rBPGCbRJBi2AgnbpYq","autMW8SgBkVYeBgqYiTuJZnkvDZMVU2MHJh9Jh7CSQ2","2KFGzrLjH9PPiqeuH2ShbS4xrcxf1ue4Yr7BMrq95LV3","4zhA8DihD59LuTELo63GnF4f6iQ33wNNzu7pPeCQTJfQ","5Z5iqQcK3HG6sZ7PsmaRVRyc15Yi7dj5yFJzMDnxx1pF","39M11vrJcowEnmf4RkoEWgphMyZ1aPXXQ1ythoQhLhYa","rFqFJ9g7TGBD8Ed7TPDnvGKZ5pWLPDyxLcvcH2eRCtt","4BbmHeEXpGq1bF2vTmD6kYFbJ1r4RDwZa21faYR2E6ky","AvkbtawpmMSy571f71WsWEn41ATHg5iHw27LoYJdk8QA","11111111111111111111111111111111","E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe","2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom","CCFLUrEwkS9rZ2Kr7UDZTAjZT5EKpF7Uae9uQZ1Xm8ci","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","SysvarRent111111111111111111111111111111111","ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix","M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"],"recentBlockhash":"ydqiAwmKz6V55frU7QwJhmvnpVfou9pURYQihonfdUe","instructions":[{"accounts":[0,10,1,2,11,10],"data":"3GyWrkssW12wSfxkr194yzCF","programIdIndex":18},{"accounts":[0,10,12,13,1,2,11,3,2,14,10,15],"data":"3Jmjmsq2jyrckdjxqSe3eYahzkwdeoBqN4BTZp4qszLEAFy","programIdIndex":18},{"accounts":[0,4,10,5,12,13,1,6,2,11,7,3,2,8,2,14,10,16,17,15,9],"data":"d6iteQtSVrfiCnAKGiES1vz4nc15HsVB129DqbiSZU9jSpQCkARLPR9ZY","programIdIndex":18}],"indexToProgramIds":{}},"signatures":["5jp8Loi1XSXWHYh6ad4MiURssRkTytgb8RwBKuby8UcMZhy1GiFG1vt26Nf5En6AwJaJDoeJcqBJkLTBphFU6DjW"]}}');
/**
 * ExecuteSale transaction is the 3rd instruction in this transaction
 * 
 * ix0: Deposit
 * ix1: Buy
 * ix2: ExecuteSale
 */
export const ExecuteSaleTransactionStaticData: ParseableTransaction = GenerateTransactionStaticDataForTesting(ExecuteSaleTx);
export const UnknownInstruction: CompiledInstruction = ExecuteSaleTransactionStaticData.Message.instructions.at(0);

const expectedPdaData = null;
const nullExpectedPrice = null;
export const StaticObjects = {
    InternalFormat: {
        Ask: new MarketplaceTransactionEntityData(
                    null, // buyer wallet
                    null, // buyer pda
                    new PublicKey('4zhA8DihD59LuTELo63GnF4f6iQ33wNNzu7pPeCQTJfQ').toString(), // seller wallet
                    new PublicKey('4BbmHeEXpGq1bF2vTmD6kYFbJ1r4RDwZa21faYR2E6ky').toString(), // seller pda
                    new PublicKey('2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom').toString(), // token mint
                    AskTransactionStaticData.BlockTime,
                    AskTransactionStaticData.Signature,
                    Marketplace.MagicEdenV2,
                    expectedPdaData,
                    33 * LAMPORTS_PER_SOL,
        ),
        Bid: new MarketplaceTransactionEntityData(
                    new PublicKey('3AE4BC9fZZztj4Rxj7bG9CxvySa8rembN4rREmx5kYaq').toString(), // buyer wallet
                    new PublicKey('Cf27HFWwjcao4oHGrtvuZ9GLk31aR7b9NKWjLCet85VB').toString(), // buyer pda
                    null, // seller wallet
                    null, // seller pda
                    new PublicKey('2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom').toString(), // token mint
                    BidTransactionStaticData.BlockTime,
                    BidTransactionStaticData.Signature,
                    Marketplace.MagicEdenV2,
                    expectedPdaData,
                    26.5 * LAMPORTS_PER_SOL,
        ),
        CancelAsk: new MarketplaceTransactionEntityData(
                    null, // buyer wallet
                    null, // buyer pda
                    new PublicKey('9eCrHbaDEc4KHKEh8ZVVMtMwbiDPJnHBzN4fSLnMEt63').toString(), // seller wallet
                    new PublicKey('35n11CyfchGtaeFNP64zkaSAh9fpr1aBAx8MaJcDiZJ2').toString(), // seller pda
                    new PublicKey('2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom').toString(), // token mint
                    CancelAskTransactionStaticData.BlockTime,
                    CancelAskTransactionStaticData.Signature,
                    Marketplace.MagicEdenV2,
                    expectedPdaData,
                    nullExpectedPrice,
        ),
        CancelBid: new MarketplaceTransactionEntityData(
                    new PublicKey('9ifYfq1ynVX9B4nyCgb1dW1pTs9EVjdN7RfFn5CoQbJP').toString(), // buyer wallet
                    new PublicKey('8Hz4npJeUeN3EYmQ2soAbtFHfpLPnAwFNTDX6yrtRHg5').toString(), // buyer pda
                    null, // seller wallet
                    null, // seller pda
                    new PublicKey('2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom').toString(), // token mint
                    CancelBidTransactionStaticData.BlockTime,
                    CancelBidTransactionStaticData.Signature,
                    Marketplace.MagicEdenV2,
                    expectedPdaData,
                    25 * LAMPORTS_PER_SOL,
        ),
        ExecuteSale: new MarketplaceTransactionEntityData(
                    new PublicKey('CqGRyhBRKSgM3kg9fS2NXK6xP9E1TcEfd2PtZAkEwi58').toString(),  // buyer wallet
                    new PublicKey('2KFGzrLjH9PPiqeuH2ShbS4xrcxf1ue4Yr7BMrq95LV3').toString(),  // buyer pda
                    new PublicKey('4zhA8DihD59LuTELo63GnF4f6iQ33wNNzu7pPeCQTJfQ').toString(),  // seller wallet
                    new PublicKey('4BbmHeEXpGq1bF2vTmD6kYFbJ1r4RDwZa21faYR2E6ky').toString(),  // seller pda
                    new PublicKey('2taikTWBXSaDqo2exfG3NBGnoQjU8CxwaNaYqSX1Miom').toString(),  // token mint
                    ExecuteSaleTransactionStaticData.BlockTime,    // date
                    ExecuteSaleTransactionStaticData.Signature,                     // signature
                    Marketplace.MagicEdenV2,                           // marketplace
                    expectedPdaData,                                                // empty pda data
                    33 * LAMPORTS_PER_SOL,                                          // price
        )
    }
}

export const ExpectedValues = {
    Ask: StaticObjects.InternalFormat.Ask,
    Bid: StaticObjects.InternalFormat.Bid,
    CancelAsk: StaticObjects.InternalFormat.CancelAsk,
    CancelBid: StaticObjects.InternalFormat.CancelBid,
    ExecuteSale: StaticObjects.InternalFormat.ExecuteSale,
    //...,
}

//export const generateExpectedGlobalId = (type: EntityType, wallet: PublicKey, mint: PublicKey, marketplace: Marketplace): string => {
//    return type + GlobalIdDelimiter + wallet.toString() + GlobalIdDelimiter + mint.toString() + GlobalIdDelimiter + marketplace;
//}