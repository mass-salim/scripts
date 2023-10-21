// ==UserScript==
// @name         MPG Jersey Unlocker
// @namespace    https://salim.abdelfettah.dev
// @version      1.1
// @description  Unlock all free jerseys
// @author       mass-salim
// @match        https://mpg.football/*
// @icon64       https://www.google.com/s2/favicons?sz=64&domain=mpg.football
// @updateURL    https://raw.githubusercontent.com/mass-salim/scripts/main/javascript/mpg-jersey-unlocker.js
// @downloadURL  https://raw.githubusercontent.com/mass-salim/scripts/main/javascript/mpg-jersey-unlocker.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let urls = {
        lockerRoom: 'https://mpg.football/shop/locker-room',
        lockerRoomData: 'https://mpg.football/shop/locker-room?_data=root',
    };

    let context = {};

    let functions = {
        extractAndSaveToken: function() {
            console.log('Extracting & saving token');
            let data = JSON.parse(document.body.innerText);
            if (data.token) {
                sessionStorage.setItem('__token', data.token);
            } else {
                console.error('No token found');
            }
            console.log('Returning to locker room');
            window.location.href = 'https://mpg.football/shop/locker-room';
        },
        addPrepareUnlockingButton: function() {
            let jerseyButton = [...document.getElementsByTagName('a')].find(a => a.href.endsWith('/shop/locker-room'));
            let nextButton = jerseyButton.nextElementSibling;
            let prepareButton = nextButton.cloneNode(true);
            prepareButton.firstChild.textContent = 'Prepare unlocking';
            prepareButton.href = 'https://mpg.football/shop/locker-room?_data=root';
            jerseyButton.parentElement.insertBefore(prepareButton, nextButton);
            console.log('Prepare unlocking button is ready');
        },
        handleAddJerseyResponse: function(response, logDiv, jerseyNumber, numberOfJerseys) {
            let logStatus = document.createElement('p');
            logDiv.appendChild(logStatus);
            if (response.status < 300) {
                console.log(`${jerseyNumber}/${numberOfJerseys}`, response);
                logStatus.style.color = 'green';
                logStatus.textContent = `${jerseyNumber}/${numberOfJerseys}: OK (${response.status})`;
            } else {
                console.warn(`${jerseyNumber}/${numberOfJerseys}`, response);
                logStatus.style.color = 'red';
                logStatus.textContent = `${jerseyNumber}/${numberOfJerseys}: KO (${response.status})`;
            }
        },
        handleAddJerseyResponseError: function(error, logDiv, jerseyNumber, numberOfJerseys) {
            console.error(`${jerseyNumber}/${numberOfJerseys}`, error);
            let logError = document.createElement('p');
            logDiv.appendChild(logError);
            logError.style.color = 'red';
            logError.textContent = `${jerseyNumber}/${numberOfJerseys}: Error (${error})`;
        },
        unlockJerseys: function(result) {
            let jerseysToUnlock = [];
            let myJerseys = result.lockerRoom.jerseys.map(jersey => jersey.id);
            for(const [jerseyId, jerseyData] of Object.entries(result.jerseysPool)) {
                if (jerseyData.productCode === 'free' && !myJerseys.includes(jerseyId)) {
                    jerseysToUnlock.push(jerseyId);
                }
            }
            let logDiv = document.createElement('div');
            let log = document.createElement('p');
            document.body.insertBefore(logDiv, document.body.children[0]);
            logDiv.appendChild(log);
            let numberOfJerseys = jerseysToUnlock.length;
            log.textContent = `Found ${numberOfJerseys} jerseys to unlock.`
            for (let index = 0; index < numberOfJerseys; index++) {
                let jerseyNumber = index + 1;
                fetch(`https://api.mpg.football/locker-room/jersey/${jerseysToUnlock[index]}/unlock`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': context.token,
                        'Host': 'api.mpg.football'
                    }
                })
                    .then(response => functions.handleAddJerseyResponse(response, logDiv, jerseyNumber, numberOfJerseys))
                    .catch(error => functions.handleAddJerseyResponseError(error, logDiv, jerseyNumber, numberOfJerseys));
            }
            console.log(jerseysToUnlock);
        },
        addExtractAndUnlockJerseysButtonFromImage: function(jerseyImage) {
            let jersey = jerseyImage.parentElement.parentElement;
            let unlock = jersey.cloneNode(true);
            unlock.getElementsByTagName('p')[0].textContent = 'All Free jerseys';
            unlock.getElementsByTagName('img')[0].src = 'https://mpg.football/build/_assets/logoMpg-GHHGJFQB.png';
            let unlockButton = unlock.getElementsByTagName('button')[0];
            unlockButton.firstChild.textContent = 'Unlock All Free';
            unlockButton.onclick = function() {
                fetch('https://api.mpg.football/locker-room/extended', {
                    headers: {
                        'Authorization': context.token
                    }
                })
                    .then(response => response.json())
                    .then(result => functions.unlockJerseys(result))
                    .catch(error => console.error(error));
            };
            jersey.parentElement.insertBefore(unlock, jersey);
            console.log('Unlock button is ready');
        },
        addExtractAndUnlockJerseysButton: function() {
            let checkInterval = setInterval(function() {
                let jerseyImage = [...document.getElementsByTagName('img')]
                        .find(img => (img.src.indexOf('jersey.mpg.football') !== -1 || img.src.indexOf('image.mpg/prod') !== -1) && img.width === 96 && img.height === 96);
                if (!!jerseyImage) {
                    clearInterval(checkInterval);
                    functions.addExtractAndUnlockJerseysButtonFromImage(jerseyImage);
                }
            }, 1000);
        },
        checkUrl: function() {
            if (window.location.href === urls.lockerRoomData) {
                functions.extractAndSaveToken();
            } else if(window.location.href === urls.lockerRoom) {
                let token = sessionStorage.getItem('__token');
                if (!token) {
                    console.warn('No token found. Please click on prepare unlocking button.');
                    window.onload = functions.addPrepareUnlockingButton();
                } else {
                    context.token = token;
                    window.onload = functions.addExtractAndUnlockJerseysButton();
                }
            }
        },
    };

    functions.checkUrl();
    window.onhashchange = functions.checkUrl;
})();
