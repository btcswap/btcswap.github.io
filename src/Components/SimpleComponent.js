import React, { Component } from 'react'
import ListComponent from './ListComponent';
import ReceiveAddress from './ReceiveAddress';
import { Eclipse } from "react-loading-io";

import GatewayJS from "@renproject/gateway";
import RenBTCAdapter from "../RenBTCAdapter.json";
import MultiCollateralBitcoin from "../MultiCollateralBitcoin.json";
import RenBTC from "../RenBTC.json";
import WBTC from "../WBTC.json";
import Web3 from "web3";

const mcbtcABI = MultiCollateralBitcoin.abi;
const mcbtcContractAddress = MultiCollateralBitcoin.networks["42"].address;

const renBtcABI = RenBTC.abi;
const renBtcContractAddress = RenBTC.networks["42"].address;

const wbtcABI = WBTC.abi;
const wbtcContractAddress = WBTC.networks["42"].address;

const renBtcAdapterAddress = RenBTCAdapter.networks["42"].address;

const Index = () => {
  return <Eclipse size={64} />;
};

class SimpleComponent extends Component {
    state = {
        amount: "",
        sendToken: 'btc',
        receiveToken: '',
        receiveBtcAddress: '',
        message: "",
        error: "",
        address: "",
        userBalances: {
          "mcbtc": 0.1,
          "wbtc": 0.1,
        },
        contractBalances: {
          "btc": 0.1,
          "wbtc": 0.1,
        },
        gatewayJS: new GatewayJS("testnet"),
        loading: true
    }

    componentDidMount = async () => {
        let web3Provider;
        console.log("MultiCollateralBitcoin", mcbtcContractAddress);
        console.log("RenBTCAdapter", renBtcAdapterAddress);
        console.log("WBTC", wbtcContractAddress);
        console.log("RenBTC", renBtcContractAddress);

        // Initialize web3 (https://medium.com/coinmonks/web3-js-ethereum-javascript-api-72f7b22e2f0a)
        // Modern dApp browsers...
        if (window.ethereum) {
            web3Provider = window.ethereum;
            try {
            // Request account access
            await window.ethereum.enable();
            } catch (error) {
            // User denied account access...
            this.logError("Please allow access to your Web3 wallet.");
            return;
            }
        }
        // Legacy dApp browsers...
        else if (window.web3) {
            web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            this.logError("Please install MetaMask!");
            return;
        }

        const address = web3Provider.selectedAddress;
        const web3 = new Web3(web3Provider);

        const networkID = await web3.eth.net.getId();
        if (networkID !== 42) {
            this.logError("Please set your network to Kovan.");
            return;
        }

        this.setState({ web3, address }, () => {
          // Update balances immediately and every 10 seconds
          this.updateBalance();
          setInterval(() => {
            this.updateBalance();
          }, 10 * 1000);
        });

        this.recoverTransfers().catch(this.logError);

        setTimeout(() => {
          this.setState({
            loading: false
          })
        }, 3000)
    }

    handleChange = event => {
        this.setState({
            [event.target.id]: event.target.value
        });

        if (event.target.id === "sendToken") {
            this.setState({ receiveToken: ""});
        }
    }

    render() {
        const { sendToken, receiveToken, message, error, contractBalances, userBalances } = this.state;
        return (
          <div className="container maindiv" style={{marginTop:'150px'}}>
            { this.state.loading ? <div style={{display: "flex", justifyContent: "center", textAlign: "center", marginTop: "100px"}}><Index /></div> : 
            <div>
              <div className="row">
                <div className="col s12 l4" >
                  <h2 className="div1"> I want to send </h2>
                </div>
                <div className="col s12 l5" style={{marginTop:'30px'}}>
                  <input type="number" className="grey-text text-darken-3 div2" style={{ borderBottom: "2px solid black", fontSize: "33px"}} id="amount" value={this.state.amount} onChange={this.handleChange} />
                </div>
                <div className="col s12 l3" style={{marginTop:'37px'}}>
                  <ListComponent id={'sendToken'} disabledToken={''} onChange={this.handleChange} defaultValue={sendToken} balances={userBalances}/>
                </div>
              </div>

              <div className="row">
                  <div className="col s12 l3" >
                    <h2 className="div1"> and receive </h2>
                  </div>
                  <div className="col s12 l3" style={{marginTop:'39px'}}>
                    <ListComponent id={'receiveToken'} disabledToken={sendToken} onChange={this.handleChange} defaultValue={receiveToken} balances={contractBalances}/>
                  </div>
                  <div >
                    <ReceiveAddress id={'receiveBtcAddress'} receiveToken={receiveToken} onChange={this.handleChange}/>
                  </div>
              </div>

              <br/>
              <div className="row">
                <div className="col s12 l8 offset-l4" >
                  <button className="btn grey darken-3" style={{marginLeft:"55px"}} onClick={this.swap}>Connect to Swap</button>
                </div>
              <div  className="row">  
                <div className="col s12 l9 offset-l3">
                  <p>{message}</p>
                  {error ? <p style={{ color: "red",marginLeft:"55px" }}>{error}</p> : null}
                </div>
              </div>   
            </div>
            </div> }
        </div>
        )
    }

    updateBalance = async() => {
      const { address, web3 } = this.state;
      const renBtcContract = new web3.eth.Contract(renBtcABI, renBtcContractAddress);
      const mcBtcContract = new web3.eth.Contract(mcbtcABI, mcbtcContractAddress);
      const wBtcContract = new web3.eth.Contract(wbtcABI, wbtcContractAddress);

      const wbtcBalance = await wBtcContract.methods.balanceOf(address).call();
      const mcbtcBalance = await mcBtcContract.methods.balanceOf(address).call();

      const wbtcContractBalance = await wBtcContract.methods.balanceOf(mcbtcContractAddress).call();
      const btcContractBalance = await renBtcContract.methods.balanceOf(mcbtcContractAddress).call();

      const userBalances = {
        "wbtc": parseInt(wbtcBalance.toString()) / 10 ** 8 ,
        "mcbtc": parseInt(mcbtcBalance.toString()) / 10 ** 8 ,
      }

      const contractBalances = {
        "btc": parseInt(btcContractBalance.toString()) / 10 ** 8,
        "wbtc": parseInt(wbtcContractBalance.toString()) / 10 ** 8,
      }

      this.setState({    
        userBalances: userBalances,
        contractBalances: contractBalances,
      });
    }

    swap = async() => {
        const {amount, sendToken, receiveToken, receiveBtcAddress} = this.state;
        const value = Math.floor(parseFloat(amount) * (10 ** 8));
        console.log(amount, sendToken, receiveToken, receiveBtcAddress);

        if (sendToken === "") {
            this.setState({ error: "please enter a valid send token"})
        }

        if (receiveToken === "") {
            this.setState({ error: "please enter a valid receive token"})
        }

        if (receiveToken === "btc" && receiveBtcAddress === "") {
            this.setState({ error: "please enter a valid receiveBtcAddress"})
            return;
        }

        if (sendToken === "mcbtc") {
            await this.withdraw(value, receiveToken);
            return;
        }
    
        if (receiveToken === "mcbtc") {
            await this.deposit(value, sendToken);
            return;
        }
    
        if (receiveToken === "btc" && sendToken === "wbtc") {
            await this.swapWBTCToBTC(value);
        } else if (receiveToken === "wbtc" && sendToken === "btc") {
            await this.swapBTCToWBTC(value);
        } else {
            this.setState({ error: `unsupported coin pair ${receiveToken}->${sendToken}` });
        }
    }
    
    swapWBTCToBTC = async(amount) => {
        const { web3, address, gatewayJS, receiveBtcAddress } = this.state;
    
        const renBtcContract = new web3.eth.Contract(renBtcABI, renBtcContractAddress);
        const balance = await renBtcContract.methods.balanceOf(mcbtcContractAddress).call();
        if (balance < amount) {
            this.setState({ error: `insufficent BTC in the wrapper contract (${balance})` });
            return;
        }
    
        const wbtcContract = new web3.eth.Contract(wbtcABI, wbtcContractAddress);
        const allowance = await wbtcContract.methods.allowance(address, renBtcAdapterAddress).call();
        if (allowance < amount) {
            await wbtcContract.methods.approve(renBtcAdapterAddress, amount.toString()).send({ from: address });
        }
    
        // You can surround shiftOut with a try/catch to handle errors.
    
        await gatewayJS.open({
            // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
            // This is the reverse of shitIn.
            sendToken: GatewayJS.Tokens.BTC.Eth2Btc,
    
            // The contract we want to interact with
            sendTo: renBtcAdapterAddress,
    
            // The name of the function we want to call
            contractFn: "swapOut",
    
            // Arguments expected for calling `deposit`
            contractParams: [
            { name: "_fromBtcVariant", type: "address", value: wbtcContractAddress },
            { name: "_to", type: "bytes", value: "0x" + Buffer.from(receiveBtcAddress).toString("hex") },
            { name: "_amount", type: "uint256", value: Math.floor(amount) },
            ],
    
            // Web3 provider for submitting burn to Ethereum
            web3Provider: web3.currentProvider,
        }).result();
    
        this.log(`Transferred ${amount} BTC to ${receiveBtcAddress}.`);
        }
    
    swapBTCToWBTC = async(amount) => {
        const { web3, gatewayJS } = this.state;
    
        const wbtcContract = new web3.eth.Contract(renBtcABI, wbtcContractAddress);
        const balance = await wbtcContract.methods.balanceOf(mcbtcContractAddress).call();
        if (balance < amount) {
            this.setState({ error: `insufficent wBTC in the wrapper contract (${balance})` });
            return;
        }
    
        try {
            await gatewayJS.open({
            // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
            sendToken: GatewayJS.Tokens.BTC.Btc2Eth,
    
            // Amount of BTC we are sending (in Satoshis)
            suggestedAmount: Math.floor(amount), // Convert to Satoshis
    
            // The contract we want to interact with
            sendTo: renBtcAdapterAddress,
    
            // The name of the function we want to call
            contractFn: "swapIn",
    
            // The nonce is used to guarantee a unique deposit address
            nonce: GatewayJS.utils.randomNonce(),
    
            // Arguments expected for calling `deposit`
            contractParams: [
                {
                name: "_msg",
                type: "bytes",
                value: web3.eth.abi.encodeParameters(["address"], [wbtcContractAddress]),
                }
            ],
    
            // Web3 provider for submitting mint to Ethereum
            web3Provider: web3.currentProvider,
            }).result();
            this.log(`Deposited ${amount} BTC.`);
        } catch (error) {
            // Handle error
            this.logError(error);
        }
    }   
    
    recoverTransfers = async() => {
        const { web3, gatewayJS } = this.state;
        // Load previous transfers from local storage
        const previousGateways = await gatewayJS.getGateways();
        // Resume each transfer
        for (const transfer of Array.from(previousGateways.values())) {
            gatewayJS
            .recoverTransfer(web3.currentProvider, transfer)
            .pause()
            .result()
            .catch(this.logError);
        }
    }
    
    
    deposit = async(value, coinType) => {
        switch (coinType) {
          case "btc":
              await this.depositBtc(value);
            break;
          case "wbtc":
              await this.depositWBTC(value);
            break;
          default:
              this.setState({ error: `unsupported coin type ${coinType}` });
            break;
        }
      }
    
      depositWBTC = async(amount) => {
        const { web3, address } = this.state;
    
        const contract = new web3.eth.Contract(wbtcABI, wbtcContractAddress);
    
        const allowance = await contract.methods.allowance(address, mcbtcContractAddress).call();
    
        if (allowance < amount) {
          await contract.methods.approve(mcbtcContractAddress, amount.toString()).send({ from: address });
        }
    
        const mcbtcContract = new web3.eth.Contract(mcbtcABI, mcbtcContractAddress);
        await mcbtcContract.methods.deposit(wbtcContractAddress, amount.toString()).send({ from: address });
      }
    
    depositBtc = async(amount) => {
        const { web3, gatewayJS } = this.state;
    
        try {
          await gatewayJS.open({
            // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
            sendToken: GatewayJS.Tokens.BTC.Btc2Eth,
    
            // Amount of BTC we are sending (in Satoshis)
            suggestedAmount: amount, // Convert to Satoshis
    
            // The contract we want to interact with
            sendTo: renBtcAdapterAddress,
    
            // The name of the function we want to call
            contractFn: "deposit",
    
            // The nonce is used to guarantee a unique deposit address
            nonce: GatewayJS.utils.randomNonce(),
    
            // Arguments expected for calling `deposit`
            contractParams: [
              {
                name: "_msg",
                type: "bytes",
                value: web3.utils.fromAscii(`Depositing ${amount} BTC`),
              }
            ],
    
            // Web3 provider for submitting mint to Ethereum
            web3Provider: web3.currentProvider,
          }).result();
          this.log(`Deposited ${amount} BTC.`);
        } catch (error) {
          // Handle error
          this.logError(error);
        }
      }
    
    withdraw = async(value, coinType) => {
        switch (coinType) {
          case "btc":
              await this.withdrawBTC(value);
            break;
          case "wbtc":
              await this.withdrawWBTC(value);
            break;
          default:
              this.setState({ error: `unsupported coin type ${coinType}` });
            break;
        }
      }
    
      withdrawBTC = async(amount) => {
            const { web3, gatewayJS, address, receiveBtcAddress } = this.state;
            
            console.log("withdrawing btc");
            const contract = new web3.eth.Contract(mcbtcABI, mcbtcContractAddress);
        
            const allowance = await contract.methods.allowance(address, renBtcAdapterAddress).call();
        
            if (allowance < amount) {
              await contract.methods.approve(renBtcAdapterAddress, amount.toString()).send({ from: address });
            }
        
            // You can surround shiftOut with a try/catch to handle errors.
        
            await gatewayJS.open({
              // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
              // This is the reverse of shitIn.
              sendToken: GatewayJS.Tokens.BTC.Eth2Btc,
        
              // The contract we want to interact with
              sendTo: renBtcAdapterAddress,
        
              // The name of the function we want to call
              contractFn: "withdraw",
        
              // Arguments expected for calling `deposit`
              contractParams: [
                { name: "_to", type: "bytes", value: "0x" + Buffer.from(receiveBtcAddress).toString("hex") },
                { name: "_amount", type: "uint256", value: Math.floor(amount) },
              ],
        
              // Web3 provider for submitting burn to Ethereum
              web3Provider: web3.currentProvider,
            }).result();
        
            this.log(`Withdrew ${amount} BTC to ${receiveBtcAddress}.`);    
      } 
    
      withdrawWBTC = async(amount) => {
        const { web3, address } = this.state;
        
        const mcbtcContract = new web3.eth.Contract(mcbtcABI, mcbtcContractAddress);
        await mcbtcContract.methods.withdraw(wbtcContractAddress, amount.toString()).send({ from: address });
      }

      log = async(message) => {
        console.log(message);
      }

      logError = async(message) => {
          console.error(message);
      }
}

export default SimpleComponent