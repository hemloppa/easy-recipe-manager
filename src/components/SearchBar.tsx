
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { updateSearchCount } from "../lib/firebase";
import { toast } from "sonner";

interface SearchBarProps {
  onSearch: (ingredients: string[], selectedTags: string[]) => void;
  availableTags: string[];
}

const SearchBar = ({ onSearch, availableTags }: SearchBarProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearch = () => {
    // Parse comma-separated ingredients
    const ingredients = searchInput
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i);

    if (ingredients.length === 0 && selectedTags.length === 0) {
      toast.error("Please enter at least one ingredient or select a tag");
      return;
    }

    // Update search count in Firebase stats
    updateSearchCount().catch(console.error);
    
    // Execute search
    onSearch(ingredients, selectedTags);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by ingredients (e.g., chicken, rice)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button
          onClick={() => setShowTagFilter(!showTagFilter)}
          className="btn-secondary flex items-center"
          aria-label="Filter by tags"
        >
          <Filter size={20} className="mr-1" />
          Filter
        </button>
        <button onClick={handleSearch} className="btn-primary">
          Search
        </button>
      </div>

      {showTagFilter && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Filter by tags:</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedTags.includes(tag)
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
