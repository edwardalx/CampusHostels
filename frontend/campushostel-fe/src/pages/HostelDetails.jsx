import React, { use, useState, useEffect } from "react";
import {
  getHostelById,
  getUnitsByPropertyId,
} from "../services/HostelServices";
import { useNavigate, useParams } from "react-router-dom";
import SkeletonCard from "../components/SkeletonCard";
import { HeroSection } from "../components";
import { Tile } from "../components/UnitTile";

export default function HostelDetails() {
  const [selectedHostel, setSelectedHostel] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { id: routeId } = useParams();
  let storedHostel = JSON.parse(localStorage.getItem("selectedHostel"));
  const hostelId = Number(routeId);
  const selectedHostelNameUpper = selectedHostel.name
    ? selectedHostel.name.toUpperCase()
    : "";
  useEffect(() => {
    try {
      setLoading(true);

      const fetchHostelDetails = async () => {
        const response = await getHostelById(hostelId || storedHostel);
        setSelectedHostel(response);
      };
      fetchHostelDetails();
    } catch (error) {
      console.warn("Error fetching hostel details:", error);
      setError("Failed to load hostel details. Please try again later.");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  }, [hostelId]);

  useEffect(() => {
    try {
      storedHostel = JSON.parse(storedHostel);
      const fetchUnits = async () => {
        const response = await getUnitsByPropertyId(hostelId || storedHostel);
        setUnits(response);
      };
      fetchUnits();
    } catch (error) {
      console.warn("Error fetching hostel details:", error);
      setError("Failed to load hostel details. Please try again later.");
    }
  }, [hostelId]);
  console.log("units", units);
  console.log("selectedHostel", selectedHostel);
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-col min-h-screen bg-secondary-light-gray">
        {/* Header */}

        {/* Main Content */}
        <main className="flex-grow">
          {/* Hero Section with Search Bar */}
          <HeroSection
            title={"EXPLORE " + selectedHostelNameUpper + " HOSTEL"}
            subtitle={
              "Find your perfect student accommodation in " +
              selectedHostel.location +
              " and proceed to payment"
            }
          ></HeroSection>
          {loading && <div>Loading hostel details...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!selectedHostel && <p>No hostel found.</p>}
          <div className="justify-center">
            selected hostel is {selectedHostelNameUpper}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {units?.map((unit) => (
              <Tile key={unit.id} hostel={selectedHostel} unit={unit} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
