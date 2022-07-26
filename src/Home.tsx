import {useEffect, useState, useContext} from "react";
import { HomeContext } from "./context/context";
import styled from "styled-components";
import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";
import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {GatewayProvider} from '@civic/solana-gateway-react';
import Countdown from "react-countdown";
import {Snackbar, Paper, LinearProgress, Chip} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import {toDate, AlertState, getAtaForMint} from './utils';
import {MintButton} from './MintButton';
import { Button } from "./components/button/Button";
import { Footer } from "./components/footer/Footer";
import AOS from 'aos'
import logo from "./images/logo.svg";
import twitter from "./images/twitter.svg";
import discord from "./images/discord.svg";
import close from "./images/close.svg";
import nia from "./images/Nia.png";
import ring from "./images/ring.svg";
import "./css/header.css";
import "./css/button.css";
import "./css/mint.css";
import "./css/anim.css";
import "./css/potrait.css";
import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    getCandyMachineState,
    mintOneToken,
    CANDY_MACHINE_PROGRAM,
} from "./candy-machine";

const cluster = process.env.REACT_APP_SOLANA_NETWORK!.toString();
const decimals = process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS ? +process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS!.toString() : 9;
const splTokenName = process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME ? process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME.toString() : "TOKEN";

const WalletAmount = styled.div`
  color: black;
  width: auto;
  padding: 0px 0px 0px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 22px;
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;
const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;
const ConnectButton = styled(WalletMultiButton)`
  border-radius: 12px !important;
  padding: 20px 36px 20px 36px;
  background-color: transparent !important;
  margin: 0 auto;
  color: #2f2d2e !important;
`;
const Card = styled(Paper)`
  display: inline-block;
  background-color: var(card-background-lighter-color) !important;
  margin: 5px;
  min-width: 40px;
  padding: 24px;
  h1{
    margin:0px;
  }
`;
const MintButtonContainer = styled.div`
  button.MuiButton-contained:not(.MuiButton-containedPrimary).Mui-disabled {
  background: transparent !important;
  color : #000 !important;
  }

  button.MuiButton-contained:not(.MuiButton-containedPrimary):hover,
  button.MuiButton-contained:not(.MuiButton-containedPrimary):focus {
    -webkit-animation: pulse 1s;
    animation: pulse 1s;
    box-shadow: 0 0 0 2em rgba(255, 255, 255, 0);
  }

  @-webkit-keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }
`;
export interface HomeProps {
    candyMachineId: anchor.web3.PublicKey;
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
}
const Home = (props: HomeProps) => {
    const navRoutes = [
        { name: "About", path: "https://noji.so/#aboutNoji" },
        { name: "Raison D'etre", path: "https://noji.so/#raison" },
        { name: "Creators", path: "https://noji.so/#creators" },
        { name: "Archetypes", path: "https://noji.so/#archetypes" },
        { name: "FAQ's", path: "https://noji.so/#wens" },
      ];
      const navRoutesSm = [
        { name: "About", path: "https://noji.so/#aboutNoji" },
        { name: "The black woman", path: "https://noji.so/#blackWoman" },
        { name: "Raison D'etre", path: "https://noji.so/#raison" },
        { name: "Creators", path: "https://noji.so/#creators" },
        { name: "Archetypes", path: "https://noji.so/#archetypes" },
        { name: "FAQ's", path: "https://noji.so/#wens" },
      ];
      const [open, setOpen] = useState(false);
      const { currentScreen } = useContext(HomeContext);
    const settings = {
		// slick carousel
		dots: false,
		infinite: true,
		speed: 500,
		slidesToShow: 3,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 2000,
		arrows: true,
		responsive: [
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
				},
			},
			{
				breakpoint: 400,
				settings: {
					arrows: false,
					slidesToShow: 1,
					slidesToScroll: 1,
				},
			},
		],
	}
    const [balance, setBalance] = useState<number>();
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
    const [isActive, setIsActive] = useState(false); // true when countdown completes or whitelisted
    const [solanaExplorerLink, setSolanaExplorerLink] = useState<string>("");
    const [itemsAvailable, setItemsAvailable] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);
    const [isSoldOut, setIsSoldOut] = useState(false);
    const [payWithSplToken, setPayWithSplToken] = useState(false);
    const [price, setPrice] = useState(0);
    const [priceLabel, setPriceLabel] = useState<string>("SOL");
    const [whitelistPrice, setWhitelistPrice] = useState(0);
    const [whitelistEnabled, setWhitelistEnabled] = useState(false);
    const [isBurnToken, setIsBurnToken] = useState(false);
    const [whitelistTokenBalance, setWhitelistTokenBalance] = useState(0);
    const [isEnded, setIsEnded] = useState(false);
    const [endDate, setEndDate] = useState<Date>();
    const [isPresale, setIsPresale] = useState(false);
    const [isWLOnly, setIsWLOnly] = useState(false);

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const wallet = useAnchorWallet();
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();

    const rpcUrl = props.rpcHost;

    const refreshCandyMachineState = () => {
        (async () => {
            if (!wallet) return;

            const cndy = await getCandyMachineState(
                wallet as anchor.Wallet,
                props.candyMachineId,
                props.connection
            );

            setCandyMachine(cndy);
            setItemsAvailable(cndy.state.itemsAvailable);
            setItemsRemaining(cndy.state.itemsRemaining);
            setItemsRedeemed(cndy.state.itemsRedeemed);

            var divider = 1;
            if (decimals) {
                divider = +('1' + new Array(decimals).join('0').slice() + '0');
            }

            // detect if using spl-token to mint
            if (cndy.state.tokenMint) {
                setPayWithSplToken(true);
                // Customize your SPL-TOKEN Label HERE
                // TODO: get spl-token metadata name
                setPriceLabel(splTokenName);
                setPrice(cndy.state.price.toNumber() / divider);
                setWhitelistPrice(cndy.state.price.toNumber() / divider);
            }else {
                setPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
                setWhitelistPrice(cndy.state.price.toNumber() / LAMPORTS_PER_SOL);
            }


            // fetch whitelist token balance
            if (cndy.state.whitelistMintSettings) {
                setWhitelistEnabled(true);
                setIsBurnToken(cndy.state.whitelistMintSettings.mode.burnEveryTime);
                setIsPresale(cndy.state.whitelistMintSettings.presale);
                setIsWLOnly(!isPresale && cndy.state.whitelistMintSettings.discountPrice === null);

                if (cndy.state.whitelistMintSettings.discountPrice !== null && cndy.state.whitelistMintSettings.discountPrice !== cndy.state.price) {
                    if (cndy.state.tokenMint) {
                        setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / divider);
                    } else {
                        setWhitelistPrice(cndy.state.whitelistMintSettings.discountPrice?.toNumber() / LAMPORTS_PER_SOL);
                    }
                }

                let balance = 0;
                try {
                    const tokenBalance =
                        await props.connection.getTokenAccountBalance(
                            (
                                await getAtaForMint(
                                    cndy.state.whitelistMintSettings.mint,
                                    wallet.publicKey,
                                )
                            )[0],
                        );

                    balance = tokenBalance?.value?.uiAmount || 0;
                } catch (e) {
                    console.error(e);
                    balance = 0;
                }
                setWhitelistTokenBalance(balance);
                setIsActive(isPresale && !isEnded && balance > 0);
            } else {
                setWhitelistEnabled(false);
            }

            // end the mint when date is reached
            if (cndy?.state.endSettings?.endSettingType.date) {
                setEndDate(toDate(cndy.state.endSettings.number));
                if (
                    cndy.state.endSettings.number.toNumber() <
                    new Date().getTime() / 1000
                ) {
                    setIsEnded(true);
                    setIsActive(false);
                }
            }
            // end the mint when amount is reached
            if (cndy?.state.endSettings?.endSettingType.amount) {
                let limit = Math.min(
                    cndy.state.endSettings.number.toNumber(),
                    cndy.state.itemsAvailable,
                );
                setItemsAvailable(limit);
                if (cndy.state.itemsRedeemed < limit) {
                    setItemsRemaining(limit - cndy.state.itemsRedeemed);
                } else {
                    setItemsRemaining(0);
                    cndy.state.isSoldOut = true;
                    setIsEnded(true);
                }
            } else {
                setItemsRemaining(cndy.state.itemsRemaining);
            }

            if (cndy.state.isSoldOut) {
                setIsActive(false);
            }
        })();
    };

    const renderGoLiveDateCounter = ({days, hours, minutes, seconds}: any) => {
        return (
            <div><Card elevation={1}><h1>{days}</h1>Days</Card><Card elevation={1}><h1>{hours}</h1>
                Hours</Card><Card elevation={1}><h1>{minutes}</h1>Mins</Card><Card elevation={1}>
                <h1>{seconds}</h1>Secs</Card></div>
        );
    };

    const renderEndDateCounter = ({days, hours, minutes}: any) => {
        let label = "";
        if (days > 0) {
            label += days + " days "
        }
        if (hours > 0) {
            label += hours + " hours "
        }
        label += (minutes+1) + " minutes left to MINT."
        return (
            <div><h3>{label}</h3></div>
        );
    };

    function displaySuccess(mintPublicKey: any): void {
        let remaining = itemsRemaining - 1;
        setItemsRemaining(remaining);
        setIsSoldOut(remaining === 0);
        if (isBurnToken && whitelistTokenBalance && whitelistTokenBalance > 0) {
            let balance = whitelistTokenBalance - 1;
            setWhitelistTokenBalance(balance);
            setIsActive(isPresale && !isEnded && balance > 0);
        }
        setItemsRedeemed(itemsRedeemed + 1);
        const solFeesEstimation = 0.012; // approx
        if (!payWithSplToken && balance && balance > 0) {
            setBalance(balance - (whitelistEnabled ? whitelistPrice : price) - solFeesEstimation);
        }
        setSolanaExplorerLink(cluster === "devnet" || cluster === "testnet"
            ? ("https://solscan.io/token/" + mintPublicKey + "?cluster=" + cluster)
            : ("https://solscan.io/token/" + mintPublicKey));
        throwConfetti();
    };

    function throwConfetti(): void {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: {y: 0.6},
        });
    }

    const onMint = async () => {
        try {
            setIsMinting(true);
            if (wallet && candyMachine?.program && wallet.publicKey) {
                const mint = anchor.web3.Keypair.generate();
                const mintTxId = (
                    await mintOneToken(candyMachine, wallet.publicKey, mint)
                )[0];

                let status: any = {err: true};
                if (mintTxId) {
                    status = await awaitTransactionSignatureConfirmation(
                        mintTxId,
                        props.txTimeout,
                        props.connection,
                        'singleGossip',
                        true,
                    );
                }

                if (!status?.err) {
                    setAlertState({
                        open: true,
                        message: 'Congratulations! Mint succeeded!',
                        severity: 'success',
                    });

                    // update front-end amounts
                    displaySuccess(mint.publicKey);
                } else {
                    setAlertState({
                        open: true,
                        message: 'Mint failed! Please try again!',
                        severity: 'error',
                    });
                }
            }
        } catch (error: any) {
            // TODO: blech:
            let message = error.msg || 'Minting failed! Please try again!';
            if (!error.msg) {
                if (!error.message) {
                    message = 'Transaction Timeout! Please try again.';
                } else if (error.message.indexOf('0x138')) {
                } else if (error.message.indexOf('0x137')) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf('0x135')) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            } else {
                if (error.code === 311) {
                    message = `SOLD OUT!`;
                } else if (error.code === 312) {
                    message = `Minting period hasn't started yet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            setIsMinting(false);
        }
    };


    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [wallet, props.connection]);

    useEffect(refreshCandyMachineState, [
        wallet,
        props.candyMachineId,
        props.connection,
        isEnded,
        isPresale
    ]);
	useEffect(() => {
		AOS.init()
	}, [])
    return (
        <div className="App">
                   <div>
              <div className="header">
                <section>
                  <a href="https://noji.so/#welcome" style={{ margin: 0 }}>
                    <img src={logo} alt="logo" />
                  </a>
                  {navRoutes.map((route, i) => (
                    <a href={route.path} key={`main-route-${i}`}>
                      {route?.name}
                    </a>
                  ))}
                </section>
                <Wallet>
                    <button
                    className="connect-btn n-button" id="three">{wallet ?
                      <WalletAmount>{(balance || 0).toLocaleString()} SOL<ConnectButton/></WalletAmount> :
                      <ConnectButton>CONNECT WALLET</ConnectButton>}</button>
                    </Wallet>
              
              </div>
            <div className="header-sm">
              <a href="https://noji.so/#welcome" style={{ margin: 0 }}>
                <img src={logo} alt="logo" />
              </a>
              <section
                className={`ham ${open ? "ham-up" : ""}`}
                onClick={() => setOpen(!open)}>
                <span className={`${open ? "open-first" : "first"}`}></span>
                <span className={`${open ? "open-last" : "last"}`}></span>
              </section>

              {open && (
                <div className="menu-wrap">
                  <section className="menu">
                    <img
                      src={close}
                      alt="close"
                      className="close"
                      onClick={() => setOpen(false)}
                    />
                    <article>
                      <div>
                        <img src={logo} alt="logo" />
                      </div>

                      <ul>
                        {navRoutesSm.map((route, i) => {
                          return (
                            <li key={`sm-route-${i}`}>
                              <a href={route?.path} onClick={() => setOpen(!open)}>
                                {route.name}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="socials social-sm">
                        <a href="https://twitter.com/0xAddie" style={{ margin: 0 }}>
                          <img src={twitter} alt="twitter" />
                        </a>
                        <a href="https://discord.com/0xAddie" style={{ margin: 0 }}>
                          <img src={discord} alt="discord" />
                        </a>
                      </div>

                      <div>
                      <Button
                      label={"CONNECT WALLET"}
                          className={"connect-btn"} />
                      </div>
                   </article>
                
              <p>© 2022 Eto Inc. | Privacy Policy | Legal & License</p>
            </section>
          </div>
        )}
            </div>
            <div className="mint-page">
                      <section className="wrap-mint-main">
                        {/* Supply */}
                        <div>
                        <div className="mint-info-card">
                        <p>available Supply</p>
                        
                        {wallet && isActive &&
                           <h3> {itemsRedeemed} / {itemsAvailable} </h3>
                        }
                       
                      </div>
                        </div>
                    
                      {/* Price */}
                      <div className="mint-info-card">
                        <p>Mint Price</p>
                        <section>
                          <h3>
                            {0.5}{" "}SOL
                          </h3>
                          <h6>(+ gas)</h6>
                        </section>
                      </div>
                        {/* Mint-Form */}
                      <div className="mint-form-wrap">
                          <section>
                              <article className="mint-btn-wrap">
                                  <div className="loader-wrap">
                                  </div>
                                  <button className="connect-btn n-button" id="three">
                                    <MintButtonContainer>
                                {!isActive && !isEnded && candyMachine?.state.goLiveDate && (!isWLOnly || whitelistTokenBalance > 0) ? (
                                    <Countdown
                                        date={toDate(candyMachine?.state.goLiveDate)}
                                        onMount={({completed}) => completed && setIsActive(!isEnded)}
                                        onComplete={() => {
                                            setIsActive(!isEnded);
                                        }}
                                        renderer={renderGoLiveDateCounter}
                                    />) : (
                                    !wallet ? (
                                            <ConnectButton className="go-mint">Connect Wallet</ConnectButton>
                                        ) : (!isWLOnly || whitelistTokenBalance > 0) ?
                                        candyMachine?.state.gatekeeper &&
                                        wallet.publicKey &&
                                        wallet.signTransaction ? (
                                            <GatewayProvider
                                                wallet={{
                                                    publicKey:
                                                        wallet.publicKey ||
                                                        new PublicKey(CANDY_MACHINE_PROGRAM),
                                                    //@ts-ignore
                                                    signTransaction: wallet.signTransaction,
                                                }}
                                                // // Replace with following when added
                                                // gatekeeperNetwork={candyMachine.state.gatekeeper_network}
                                                gatekeeperNetwork={
                                                    candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                                                } // This is the ignite (captcha) network
                                                /// Don't need this for mainnet
                                                clusterUrl={rpcUrl}
                                                options={{autoShowModal: false}}
                                            >
                                                <MintButton
                                                    candyMachine={candyMachine}
                                                    isMinting={isMinting}
                                                    isActive={isActive}
                                                    isEnded={isEnded}
                                                    isSoldOut={isSoldOut}
                                                    onMint={onMint}
                                                />
                                            </GatewayProvider>
                                        ) : (
                                            <MintButton
                                                candyMachine={candyMachine}
                                                isMinting={isMinting}
                                                isActive={isActive}
                                                isEnded={isEnded}
                                                isSoldOut={isSoldOut}
                                                onMint={onMint}
                                            />
                                        ) :
                                        <h1>Mint is private.</h1>
                                        )}
                                    
                                </MintButtonContainer>
                                </button>
                                </article>
                              </section>
                              </div>
                        </section>
                      <section className="portrait">
                        <img src={nia} alt="woman" className="woman" />
                      </section>
                      <section className="rotating-ring">
                        <img src={ring} alt="ring" />
                      </section>
                </div>
                <div
        className={`footer-wrapper ${
          currentScreen === 0 || currentScreen === 6
            ? "mobile-footer-show"
            : "mobile-footer-hide"
        }`}
      >
        <Footer />
      </div>
      </div>
      <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={() => setAlertState({...alertState, open: false})}
            >
                <Alert
                    onClose={() => setAlertState({...alertState, open: false})}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar> 
          
    </div>
    );
};

export default Home;
