const WalletConnectQRCodeModal = require('@walletconnect/qrcode-modal').default;
const TrezorConnect = require('trezor-connect').default;
const Portis = require('@portis/web3');
const Web3 = require('web3');
const $ = require('jquery');
require('bootstrap');

const modal = require('../static/asset/modal');
const { windowWeb3, windowProvider } = require('./global');
const createLedgerWeb3 = require('./ledger');
const myAlert = require('./alert');
const createTrezorEngine = require('./trezorEngine').default;
const config = require('./config.js').default;

const modalHide = () => {
    $('#dappQrcodeModal').modal('hide');
};

const modalStartLoading = () => {
    $('#walletGroup').hide();
    $('#spinner').show();
};

const toggleQrcode = () => {
    $('#dappQrcodeModal').modal();
};

const showLedgerDerivationPath = () => {
    $('#walletGroup').hide();
    $('#ledger-path').show();
};

const ledgerPathGoBack = () => {
    $('#ledger-path').hide();
    $('#walletGroup').show();
};

const ledgerStartLoading = () => {
    $('#ledger-path').hide();
    $('#spinner').show();
};

const ledgerLoadingTimeOut = () => {
    $('#spinner').hide();
    $('#walletGroup').show();
};

const addWalletBtnListener = (walletConnector, end, onLoginSuccess) => {
    // add listener once
    $('#use-metamask-btn').click(() => {
        if (!(windowProvider && windowProvider.isMetaMask)) {
            console.debug('Can\'t find MetaMask');
            myAlert.metamask();
            return;
        }
        console.debug('Use MetaMask');

        window.ethereum = windowProvider;
        window.web3 = windowWeb3;

        modalStartLoading();
        window.ethereum.enable().then((res) => {
            console.debug('res: ', res);
            modalHide();
            end(null, res);
        }).catch((err) => {
            modalHide();
            end(err);
        });
    });
    $('#use-dapper-btn').click(() => {
        if (!(windowProvider && windowProvider.isDapper)) {
            console.debug('Can\'t find Dapper');
            myAlert.dapper();
            return;
        }

        console.debug('Use Dapper');

        window.ethereum = windowProvider;
        window.web3 = windowWeb3;


        modalStartLoading();
        window.ethereum.enable().then((res) => {
            console.debug('res: ', res);
            modalHide();
            end(null, res);
        }).catch((err) => {
            modalHide();
            end(err);
        });
    });
    $('#use-portis-btn').click(() => {
        console.debug('Use Portis');

        const portis = new Portis('696237e9-38fb-406a-a4d6-bfa3a4d63293', config.network);
        const web3 = new Web3(portis.provider);
        window.ethereum = portis.provider;
        window.web3 = web3;
        portis.showPortis();

        modalStartLoading();
        window.ethereum.enable().then((res) => {
            console.debug('res: ', res);
            modalHide();
            end(null, res);
        }).catch((err) => {
            modalHide();
            end(err);
        });
    });
    $('#use-torus-btn').click(() => {
        console.debug('Use Torus');

        // Create web3 of Torus
        require('@toruslabs/torus-embed');

        modalStartLoading();
        const timerID = setInterval(() => {
            // Check if Web3 of Torus is loaded
            if (web3.currentProvider.isTorus) {
                window.ethereum.enable().then((res) => {
                    console.debug('res: ', res);
                    modalHide();
                    end(null, res);
                }).catch((err) => {
                    modalHide();
                    end(err);
                });

                clearInterval(timerID);
            }
        }, 1000);
    });
    $('#use-ledger-btn').click(async () => {
        console.debug('Use Ledger');
        showLedgerDerivationPath();
        $('#go-back').click(() => {
            ledgerPathGoBack();
        });
        $('#use-legacy-path').click(async () => {
            ledgerStartLoading();
            // Create web3 of Ledger
            const engine = createLedgerWeb3('legacyPath');
            const web3 = new Web3(engine);

            // Must call this or coinbase will not show address
            let accounts;
            try {
                accounts = await web3.eth.getAccounts();
                console.debug(accounts);
                // Set default Account
                const [firstAccount, ...rest] = accounts;
                web3.eth.defaultAccount = firstAccount;
                // Set web3 and ethereum
                window.web3 = web3;
                window.ethereum = engine;
                modalHide();
                end(null, [firstAccount]);
            } catch (e) {
                myAlert.ledger();
                ledgerLoadingTimeOut();
            }
        });
        $('#use-ledger-live-path').click(async () => {
            ledgerStartLoading();
            // Create web3 of Ledger
            const engine = createLedgerWeb3('ledgerLivePath');
            const web3 = new Web3(engine);

            // Must call this or coinbase will not show address
            let accounts;
            try {
                accounts = await web3.eth.getAccounts();
                console.debug(accounts);
                // Set default Account
                const [firstAccount, ...rest] = accounts;
                web3.eth.defaultAccount = firstAccount;
                // Set web3 and ethereum
                window.web3 = web3;
                window.ethereum = engine;
                modalHide();
                end(null, [firstAccount]);
            } catch (e) {
                myAlert.ledger();
                ledgerLoadingTimeOut();
            }
        });
    });
    $('#use-trezor-btn').click(async () => {
        modalStartLoading();
        TrezorConnect.manifest({
            email: 'hello@dapppocket.io', // Use Our Data
            appUrl: 'https://dappsdk.io/',
        });
        const result = await TrezorConnect.ethereumGetAddress({
            path: "m/44'/60'/0'/0/0",
        });
        if (result.success) {
            // Add Provider and web3
            const { address } = result.payload;
            const trezorEngine = createTrezorEngine(address);
            window.ethereum = trezorEngine;
            const web3 = new Web3(trezorEngine);
            window.web3 = web3;
            modalHide();
            end(null, [address]);
        } else {
            modalHide();
            end(result.payload);
        }
    });
    $('#use-wc-btn').click(() => {
        console.debug('Use WalletConnect');

        if (window.isMobile) { // Mobile
            if (windowWeb3 && windowProvider) { // Web3-compatible wallets
                windowWeb3.eth.getAccounts((err, res) => {
                    if (err) {
                        modalHide();
                        end(err);
                    }
                    modalHide();
                    window.web3 = windowWeb3;
                    window.ethereum = windowProvider;
                    end(null, res);
                });
            } else { // Web3-incompatible, e.g., Chrome, Firefox
                myAlert.wcUnsupport();
            }
        } else { // PC/MAC Broswer
            modalHide();

            if (walletConnector.connected) {
                walletConnector.killSession();
            }

            // create new session
            walletConnector.createSession().then(() => {
                // get uri for QR Code modal
                const { uri } = walletConnector;
                // display QR Code modal
                WalletConnectQRCodeModal.open(uri, () => {
                    console.debug('QR Code Modal closed');
                });
            });

            // Subscribe to connection events
            walletConnector.on('connect', (error, payload) => {
                if (error) {
                    throw error;
                }

                // Close QR Code Modal
                WalletConnectQRCodeModal.close();

                // Get provided accounts and chainId
                const { accounts, chainId } = payload.params[0];
                onLoginSuccess(true, accounts, walletConnector);
                end(null, accounts);
            });
        }
    });
    $('#help-button').click(() => {
        myAlert.help();
    });
};

module.exports = {
    showLoginQrcodeWithString: (walletConnector, end, onLoginSuccess = () => {}) => {
        // If modal not exist, append it?
        if ($('#dappQrcodeModal').length === 0) {
            $('body').append(modal);
            addWalletBtnListener(walletConnector, end, onLoginSuccess);

            // Set modal title
            const title = `Sign in ${$(document).find('title').text()}`;
            $('#dapp-title').text(title);
            const iconSrc = `https://www.google.com/s2/favicons?domain=${window.location.href}`;
            $('#dapp-icon').attr('src', iconSrc);

            // Set modal intro
            $('#modal-intro').text('Choose your favorite wallet');

            // Hide wallets that don't support mobile
            if (window.isMobile) {
                $('#use-metamask-btn').css('display', 'none');
                $('#use-dapper-btn').css('display', 'none');
                $('#use-ledger-btn').css('display', 'none');
                $('#more-options').css('display', 'block');
            }
            // Add dismiss handler
            const listener = () => {
                console.debug('on dappQrcodeModal close');
                $('#dappQrcodeModal').off();
            };
            $('#dappQrcodeModal').on('hidden.bs.modal', listener);
        }


        // display modal
        toggleQrcode();
    },
};
