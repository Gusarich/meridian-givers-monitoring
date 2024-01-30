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
                'get_wallet_data',
                []
            );

            // Read the number from the balance response
            const balance = balanceResponse.stack.readNumber();

            // Format the number with commas
            const formattedBalance = Math.floor(balance / 1e9).toLocaleString();

            // Update the progress bar for the current giver
            const progress = document.getElementById(`giver${index + 1}`);
            if (progress) {
                progress.value = balance; // You may need to adjust based on your scale
                const label = progress.previousElementSibling; // Assuming label is right before progress bar
                label.textContent =
                    label.textContent.split('#')[0] +
                    '#' +
                    ((index % 10) + 1) +
                    ' - Balance: ' +
                    formattedBalance +
                    ' GRAM';
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
                    Number(5000000000).toLocaleString() +
                    ' GRAM';
            }
            {
                const label = totalProgress.previousElementSibling;
                label.textContent =
                    'Mining Progress: ' +
                    (
                        ((5000000000000000000 - total) / 5000000000000000000) *
                        100
                    ).toFixed('2') +
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
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }
}

// Call the function to start the update process
document.addEventListener('DOMContentLoaded', (event) => {
    main();
});
