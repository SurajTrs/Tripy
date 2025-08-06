import { getUberRideEstimates } from '@/lib/getUberRideEstimates';

const accessToken = 'your_valid_access_token'; // Use real OAuth token here

const testUberEstimate = async () => {
  try {
    const data = await getUberRideEstimates(
      accessToken,
      12.9716, // from latitude
      77.5946, // from longitude
      12.9352, // to latitude
      77.6146  // to longitude
    );
    console.log('Uber Estimates:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching Uber estimate:', err);
  }
};

testUberEstimate();
