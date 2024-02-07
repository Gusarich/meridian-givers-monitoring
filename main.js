async function main() {
    const client = new TonClient({
        endpoint: await getHttpEndpoint(),
    });

    // Function to update a single giver's balance
    async function updateGiverBalance(giver, index) {
        try {
            // Parse the address from the current giver
            const address = Address.parse(giver);

            // Fetch the balance using the parsed address
            const balanceResponse = await client.callGetMethod(
                address,
                'get_mining_status',
                []
            );

            // Read the number from the balance response
            let stack = balanceResponse.stack;
            stack.skip(6);
            const leftSolutons = stack.readNumber();
            const balance =
                leftSolutons * window.solutionRewards[Math.floor(index / 10)];
            if (window.giversInitialBalances[index] === null) {
                window.giversInitialBalances[index] = balance;
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

            const formattedTimeToDrain = formatTimeToDrain(timeToDrain);

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

    // Function to update the total mining progress
    function updateTotalMiningProgress(total) {
        const totalProgress = document.getElementById('totalMiningProgress');
        if (totalProgress) {
            totalProgress.value = total; // Assuming total is within the min-max range of the progress bar
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
                    ((total / 420000000000000000) * 100).toFixed('2') +
                    '%';
            }
        }
    }

    // Infinite loop to update balances
    while (true) {
        // Create a promise for each giver's balance update
        const updatePromises = givers.map(updateGiverBalance);

        // Wait for all updates to complete and sum the balances
        const balances = await Promise.all(updatePromises);
        const totalBalance = balances.reduce(
            (acc, balance) => acc + balance,
            0
        );

        // Update the total mining progress bar
        updateTotalMiningProgress(totalBalance);

        // Wait for 10 seconds before starting the next iteration
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

// Call the function to start the update process
document.addEventListener('DOMContentLoaded', (event) => {
    main();
});
