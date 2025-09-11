import Navigation from '../Navigation';

export default function NavigationExample() {
  const handleSearch = (query: string) => {
    console.log('Search example:', query);
  };

  return <Navigation onSearch={handleSearch} />;
}