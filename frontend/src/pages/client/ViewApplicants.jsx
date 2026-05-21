import React, { useEffect, useState } from "react";
import axios from "axios";

const ViewApplicants = ({ jobId }) => {

  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const res = await axios.get(`/api/applications/job/${jobId}`);
      setApplications(res.data.applications);
    } catch (error) {
      console.error(error);
    }
  };

  const accept = async (id) => {
    await axios.put(`/api/applications/status/${id}`, {
      status: "accepted",
    });
    fetchApplicants();
  };

  const reject = async (id) => {
    await axios.put(`/api/applications/status/${id}`, {
      status: "rejected",
    });
    fetchApplicants();
  };

  return (
    <div>
      <h2>Applicants</h2>

      {applications.map((app) => (
        <div key={app._id} className="card">

          <h3>{app.freelancer.name}</h3>
          <p>Email: {app.freelancer.email}</p>
          <p>Experience: {app.freelancer.experience}</p>
          <p>Skills: {app.freelancer.skills}</p>
          <p>Rating: ⭐ {app.freelancer.rating}</p>

          <button onClick={() => accept(app._id)}>Accept</button>
          <button onClick={() => reject(app._id)}>Reject</button>

        </div>
      ))}

    </div>
  );
};

export default ViewApplicants;