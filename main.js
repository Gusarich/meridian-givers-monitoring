async function main() {
    const client = new TonClient({
        endpoint: await getHttpEndpoint(),
    });

    const updateDelay = 1000;

    async function updateGiverBalance(giver, index) {
        try {
            if (!giver) {
                throw new Error('Giver address is empty');
            }
    
            // Parse the address from the current giver
            const address = Address.parse(giver);
    
            // Fetch the balance using the parsed address
            const balanceResponse = await client.callGetMethod(
                address,
                'get_mining_status',
                []
            );
    
            if (!balanceResponse) {
                throw new Error('Balance response is empty');
            }
    
            if (!balanceResponse.stack) {
                throw new Error('Stack data is missing in the balance response');
            }
    
            // Read the number from the balance response
            let stack = balanceResponse.stack;

            // Checking that the stack exists and contains items
            if (!stack || !stack.items) {
                throw new Error('Invalid stack data in the balance response');
            }

            stack.skip(6);
            const leftSolutons = stack.readNumber()
            const balance = leftSolutons * window.solutionRewards[Math.floor(index / 10)];

            if (window.giversInitialBalances[index] === null) {
                window.giversInitialBalances[index] = balance;
            } else if (window.giversInitialBalances[index] <= balance) {
                return window.giversInitialBalances[index]
            }
    
            // Format the number with commas
            const formattedBalance = Math.floor(balance / 1e9).toLocaleString();
    
            // Update the progress bar for the current giver
            const progress = document.getElementById(`giver${index + 1}`);
    
            // Calculate the expected time to drain the balance
            const timePassed = Date.now() - window.loadTime;
            const drained = window.giversInitialBalances[index] - balance;
            const drainingSpeed = drained / (timePassed / 1000);
            const timeToDrain = balance / drainingSpeed;
    
            function formatTimeToDrain(timeToDrain) {
                if (timeToDrain === Infinity) {
                    return '...';
                }
    
                const seconds = Math.floor(timeToDrain % 60);
                const minutes = Math.floor((timeToDrain / 60) % 60);
                const hours = Math.floor((timeToDrain / (60 * 60)) % 24);
                const days = Math.floor(timeToDrain / (60 * 60 * 24));
    
                let formattedTime = '';
                if (days > 0) {
                    formattedTime += `${days} day${days > 1 ? 's' : ''} `;
                } else if (hours > 0) {
                    formattedTime += `${hours} hour${hours > 1 ? 's' : ''} `;
                } else if (minutes > 0) {
                    formattedTime += `${minutes} minute${
                        minutes > 1 ? 's' : ''
                    } `;
                } else if (seconds > 0) {
                    formattedTime += `${seconds} second${
                        seconds > 1 ? 's' : ''
                    } `;
                }
    
                return formattedTime.trim();
            }

            if (progress) {
                progress.value = balance; // You may need to adjust based on your scale
                const label = progress.previousElementSibling; // Assuming label is right before progress bar
                if (balance >= 100000000000) {
                    label.textContent =
                        label.textContent.split('#')[0] +
                        '#' +
                        ((index % 10) + 1) +
                        ' - Balance: ' +
                        formattedBalance +
                        ' MRDN, expected to drain in ' +
                        formatTimeToDrain(timeToDrain);
                } else {
                    label.textContent =
                        label.textContent.split('#')[0] +
                        '#' +
                        ((index % 10) + 1) +
                        ' - DRAINED';
                }
            }
            return balance; // Return the balance for use in the total
        } catch (error) {
            console.error('Error fetching balance for giver:', giver, error);
            return 0; // Return 0 if there was an error
        }
    }

    async function updateTotalMiningProgress(total) {
        const totalProgress = document.getElementById('totalMiningProgress');
        if (totalProgress) {
            totalProgress.value = total;
            {
                const label =
                    totalProgress.previousElementSibling.previousElementSibling;
                label.textContent =
                    'Total Givers Balance: ' +
                    Math.floor(total / 1e9).toLocaleString() +
                    ' / ' +
                    Number(420000000).toLocaleString() +
                    ' MRDN';
            }
            {
                const label = totalProgress.previousElementSibling;
                label.textContent =
                    'Available for Mining: ' +
                    ((total / 420000000000000000) * 100).toFixed(2) +
                    '%';
            }
        }
    }

    async function updateAllBalances() {
        let total = 0;
        for (let i = 0; i < givers.length; i++) {
            total += await updateGiverBalance(givers[i], i);
        }
        return total;
    }

    async function updateLoop() {
        while (true) {
            const total = await updateAllBalances();
            await updateTotalMiningProgress(total);
            await new Promise(resolve => setTimeout(resolve, updateDelay));
        }
    }

    updateLoop();
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});
