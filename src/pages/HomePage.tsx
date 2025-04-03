
import { useState, useEffect } from "react";
import { db, collection, query, getDocs, orderBy, where, onSnapshot } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import SearchBar from "../components/SearchBar";
import RecipeCard, { Recipe } from "../components/RecipeCard";
import { ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const HomePage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "az" | "za">("newest");
  const { user } = useAuth();

  // Load recipes and user favorites
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    // Create a real-time listener for recipes
    const recipesQuery = query(
      collection(db, "recipes"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeRecipes = onSnapshot(
      recipesQuery,
      (snapshot) => {
        const recipesList: Recipe[] = [];
        const tagsSet = new Set<string>();

        snapshot.forEach((doc) => {
          const recipeData = doc.data() as Recipe;
          recipesList.push(recipeData);

          // Collect all unique tags
          recipeData.tags.forEach((tag) => tagsSet.add(tag));
        });

        setRecipes(recipesList);
        setFilteredRecipes(recipesList);
        setAvailableTags(Array.from(tagsSet));
        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading recipes:", error);
        toast.error("Failed to load recipes");
        setIsLoading(false);
      }
    );

    // Get user favorites
    const loadFavorites = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const unsubscribeFavorites = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setFavorites(userData.favorites || []);
          }
        });

        return unsubscribeFavorites;
      } catch (error) {
        console.error("Error loading favorites:", error);
        return () => {};
      }
    };

    const favoritesPromise = loadFavorites();

    return () => {
      unsubscribeRecipes();
      favoritesPromise.then(unsubscribe => unsubscribe());
    };
  }, [user]);

  // Handle search
  const handleSearch = (ingredients: string[], selectedTags: string[]) => {
    if (ingredients.length === 0 && selectedTags.length === 0) {
      setFilteredRecipes(recipes);
      return;
    }

    // Filter recipes based on ingredients and tags
    const filtered = recipes.filter((recipe) => {
      // Filter by ingredients
      const ingredientMatch = ingredients.length === 0 || ingredients.some((ingredient) =>
        recipe.ingredients.some((ri) =>
          ri.toLowerCase().includes(ingredient.toLowerCase())
        )
      );

      // Filter by tags
      const tagMatch = selectedTags.length === 0 || selectedTags.every((tag) =>
        recipe.tags.includes(tag)
      );

      return ingredientMatch && tagMatch;
    });

    setFilteredRecipes(filtered);
    
    if (filtered.length === 0) {
      toast.info("No recipes found matching your search criteria");
    }
  };

  // Update favorites state
  const updateFavorites = (recipeId: string, isFavorite: boolean) => {
    setFavorites((prev) =>
      isFavorite
        ? [...prev, recipeId]
        : prev.filter((id) => id !== recipeId)
    );
  };

  // Handle sort change
  const handleSortChange = (option: typeof sortOption) => {
    setSortOption(option);

    const sorted = [...filteredRecipes].sort((a, b) => {
      if (option === "newest") {
        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      } else if (option === "oldest") {
        return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
      } else if (option === "az") {
        return a.title.localeCompare(b.title);
      } else {
        return b.title.localeCompare(a.title);
      }
    });

    setFilteredRecipes(sorted);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Find Recipes</h1>

      <SearchBar onSearch={handleSearch} availableTags={availableTags} />

      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""} found
        </p>

        <div className="relative">
          <select
            className="input py-1 pr-8 appearance-none"
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as typeof sortOption)}
            aria-label="Sort recipes"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No recipes found</p>
          <a href="/add-recipe" className="btn-primary inline-flex items-center">
            Add a Recipe <ChevronRight size={16} className="ml-1" />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.recipe_id}
              recipe={recipe}
              isFavorite={favorites.includes(recipe.recipe_id)}
              updateFavorites={updateFavorites}
              refreshRecipes={() => {}} // No need to refresh with real-time updates
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
