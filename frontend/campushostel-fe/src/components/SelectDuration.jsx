import Select from "react-select";

const durationOptions = [
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" },
  { value: "24", label: "24 Months" },
];

export default function DurationSelect({ duration, setDuration,  }) {
  return (
    <div  className="w-90 mx-2 md:w-full md:mx-0 h-10 px-4 py-5 bg-teal-700/50 border border-teal-600 rounded-lg text-white 
                  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent 
                  text-center ">
      <Select
        options={durationOptions}
        value={durationOptions.find((opt) => opt.value === duration)}
        onChange={(selected) => setDuration(selected.value)}
        placeholder="Select Duration"
        className="text-white"
      />
    </div>
  );
}
