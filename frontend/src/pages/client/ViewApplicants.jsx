import React, { useEffect, useState } from "react";
import API from "../../api";
import toast from "react-hot-toast";

const ViewApplicants = ({ jobId }) => {

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/applications/job/${jobId}`);
      setApplications(res.data.applications);
      console.log("✅ Applicants loaded:", res.data.applications);
    } catch (error) {
      console.error("❌ Error fetching applicants:", error);
      toast.error("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  const accept = async (id) => {
    try {
      await API.put(`/applications/status/${id}`, {
        status: "accepted",
      });
      toast.success("✅ Application accepted");
      fetchApplicants();
    } catch (error) {
      console.error("❌ Error accepting application:", error);
      toast.error("Failed to accept application");
    }
  };

  const reject = async (id) => {
    try {
      await API.put(`/applications/status/${id}`, {
        status: "rejected",
      });
      toast.success("❌ Application rejected");
      fetchApplicants();
    } catch (error) {
      console.error("❌ Error rejecting application:", error);
      toast.error("Failed to reject application");
    }
  };

  if (loading) return <div className="text-center py-8">Loading applicants...</div>;

  if (applications.length === 0) {
    return <div className="text-center py-8 text-gray-500">No applications yet</div>;
  }

  return (
    <div>
      <h2>Applicants ({applications.length})</h2>

      {applications.map((app) => (
        <div key={app._id} className="card">

          <h3>{app.freelancerId.name}</h3>
          <p>Email: {app.freelancerId.email}</p>
          <p>Experience: {app.freelancerId.experience}</p>
          <p>Skills: {app.freelancerId.skills}</p>
          <p>Rating: ⭐ {app.freelancerId.rating}</p>

          <button onClick={() => accept(app._id)}>Accept</button>
          <button onClick={() => reject(app._id)}>Reject</button>

        </div>
      ))}

    </div>
  );
};

export default ViewApplicants;