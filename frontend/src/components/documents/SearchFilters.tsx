import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (query: string, filters: any) => void;
}

export const SearchFilters = ({ onSearch }: SearchFiltersProps) => {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');

  const isInitialMount = useRef(true);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = () => {
    onSearch(query, {
      department: department === 'all' || !department ? undefined : department,
      category: category === 'all' || !category ? undefined : category,
    });
  };

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    handleSearch();
  }, [debouncedQuery, department, category]);

  return (
    <div className="flex gap-2 flex-wrap items-center bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Semantic Search (e.g. 'invoices from last week')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>

      <div className="w-[150px]">
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[150px]">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
            <SelectItem value="Contract">Contract</SelectItem>
            <SelectItem value="Resume">Resume</SelectItem>
            <SelectItem value="Policy">Policy</SelectItem>
            <SelectItem value="Report">Report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSearch}>
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
};
