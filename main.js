window.Buffer = require('buffer').Buffer;
const TonClient = require('@ton/ton').TonClient;
const getHttpEndpoint = require('@orbs-network/ton-access').getHttpEndpoint;
const Address = require('@ton/ton').Address;
const fromNano = require('@ton/ton').fromNano;

const givers = [
    'EQDz5ABKpaMO8BunzgNpcG8TAHvleDXGjSqIi6nOf5cLsFKg',
    'EQB0wM5SSGxOMQW1kiA_CSnZi8xONhr2EaH0-DH3ErshW_kT',
    'EQDifNns50Ial2wezfhHT69ycmucPjQvbVa8qLsbFoVqN9_-',
    'EQDMI8s3OcoaM5A9OhIOj8lh1jqGVoJc4rouNi1XPIu5YcXh',
    'EQCGGM9fF9hmvAt7OLWZKbX0tf3A5ZrCF7EW5mmdUk3wkqGm',
    'EQCh7TvrKTFF1shor0ni2SsDF2poyGltxgWaJYOY6J3kqi1G',
    'EQB3zmSjxPn2c-EcbDAzYiPZtbPi8DkxdcnjHYKRG3xealN0',
    'EQBFUICbJRNPrV1Q6RN12oq7TNc87hkyV_8stbQOn5Q0ddd2',
    'EQA-9Z_fJ3PstFkCoZIMij9xM3SVEJfqYtv-x8tKfUlb0Bh5',
    'EQDKx_EepIPaTIBiaCLbyQn23cyxHQ2UhZxZWf34AKi-MrPN',
    'EQAdbzmwgiGzoO8Qd9TaXez1_glc3u5k5OhyVP19eQU6_w8u',
    'EQDAsvqI2NjvIQRgBZlJlLgE1O_qCbhLF0JHJaCacN5JYqlh',
    'EQB32_v8qa1Acdbxu4o_fe6XkiyBNWwjeyzSmFYOH4E8siAI',
    'EQBt17w56e3ZJTl2KlVOt8sNYecHHhOOfM2n4G7vDSlh5bpi',
    'EQAVYeKiun0grXNECt2A-m3N9jmX4eLFazefhmpfATZv_3nd',
    'EQCGGMVDNldf8rEk7Kes5lylUrONdXq9qSg2OO2u-fC-6AHP',
    'EQCmEkx3VXRdbkvqs6qic91cxphZsPS2vAUvN70qWymbKa_a',
    'EQBQ9V9FSSnbG180zmshd7jDgqiUiCXH-oYerS1-Z66juHBd',
    'EQBLstaZ2tad5CSg-uVP76fwvj_K8SBrkOvLKP7pCEYAmHFY',
    'EQC7FvnqMqEltKvFyuGiNnfJLh-d8Ej0HieRp73l0NoyJtj4',
    'EQDuVMbAnnQr9Ecxd2sDIc5TDjgRgcFCLyL4sEOLUuTAYDEO',
    'EQCYlzcaWPnHZu2koCLyXh9Jw9wQwRbqaqNIw2bhkfQaFdW8',
    'EQBD5hih9xsfWEN41tJPMvabiLaz1jh86KkM9nKG3hOq1DO-',
    'EQBuGoJmb8aUOMd0yt4pkevSY1WEWGyHyQkyTMOZZw4fnZhS',
    'EQBKkIbu4suW_V8yzB3hBqDXOD_fe7w4jOWpf0231XSNMmC7',
    'EQD5VUfl0vs24Pcf1dj6LV5La7prfn1lbzhrcgQ33lm5v1zM',
    'EQBwKfqIlQ3HkDuS1MiNlUc0h77xYL1N7YeowU49sDwnwDfU',
    'EQBp8dVtgqMOdFmo4zF0Q3S8p37M4riJ4HKDWN3f4kzpbSjD',
    'EQC9MrbOn_RAbzBqPbm9OZmDOZipE_F9_DyAjBlRnZnzpRTu',
    'EQAn8xg-0ertl0ATCSeKdywVXHrXyjv3gRg6ofy83IEmmv5T',
    'EQAHayh7282LwrdvEN9DpVgSzK_Z4lgNsbFRtEehiV0Bjy8D',
    'EQCg7Bjedg1TXm4zzwt1-_YgaCjzSdxXrNzHTv0978eaHEPL',
    'EQBnt4TnEunxoTnbVFN3i1UcNFYH4y3NnLha7i0BwGFpfR0d',
    'EQCiMbkesO1ky9lnfFcA3oc8W8DUrd2Giv1Jx9EsL9lifYVV',
    'EQBpPJW0LD6JWBdfPbRZjdlO2oduMNV9DiTSvnvUbL5ZbD_S',
    'EQAMYy1yijpkHX9yqMvSSr2CeIEiQRuhy50EoCHTMo4gaGY1',
    'EQCakdHQb-6O89M65VFB9ryN637s3P0-uk8-yZ4WGVEsu-He',
    'EQA8g2QX0WGIb3Papznpo1BoFrmYRoCp5NsLQXP-o8qMI95I',
    'EQA_FZx8tpyPyAN6ZXssaAh3vqReoDe3MdCar7aj_9Ixe6tP',
    'EQCHhMzHF_mh1fiahPoXPuyWuohpUtMwVorD-zpvxfgmsq0J',
];

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

            // Update the progress bar for the current giver
            const progress = document.getElementById(`giver${index + 1}`);
            if (progress) {
                progress.value = balance; // Here you might need to adjust based on your scale
                const label = progress.previousElementSibling; // Assuming label is right before progress bar
                label.textContent =
                    label.textContent.split('#')[0] +
                    '#' +
                    (index + 1) +
                    ' - Balance: ' +
                    fromNano(balance);
            }
        } catch (error) {
            console.error('Error fetching balance for giver:', giver, error);
        }
    }

    // Infinite loop to update balances
    while (true) {
        // Create a promise for each giver's balance update
        const updatePromises = givers.map(updateGiverBalance);

        // Wait for all updates to complete
        await Promise.all(updatePromises);

        // Wait for 10 seconds before starting the next iteration
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

// Call the function to start the update process
document.addEventListener('DOMContentLoaded', (event) => {
    main();
});
