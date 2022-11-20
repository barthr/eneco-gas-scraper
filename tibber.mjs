import fetch from "node-fetch";

const baseUrl = "https://api.tibber.com/v1-beta/gql";

const headers = () => {
  return {
    Authorization: `Bearer ${process.env.TIBBER_API_KEY}`,
    "User-Agent": "Energy Dasbhoard By (github.com/barthr)",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const retrieveCurrentEnergyPrice = async () => {
  const query = `
    {
        viewer {
          homes {
            currentSubscription{
              priceInfo{ current{ total } }
            }
          }
        }
      }
    `;

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query }),
  });

  return await response.json();
};

const retrieveUsageThisPeriod = async (last) => {
  const query = `
    {
        viewer {
          homes {
            consumption(resolution: DAILY, last: ${last}) {
              nodes {
                cost
                consumption
              }
            }
          }
        }
      }
    `;

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query }),
  });

  return await response.json();
};

export { retrieveCurrentEnergyPrice, retrieveUsageThisPeriod };
