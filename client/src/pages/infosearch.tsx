import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Loader2, AlertCircle, Database, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface InfoSearchResult {
  [key: string]: string;
}

interface InfoSearchProfile {
  name: string;
  creation_date: string;
  balance: number;
}

export default function InfoSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InfoSearchResult[]>([]);
  const [searchType, setSearchType] = useState<"basic" | "extended">("basic");

  // Fetch profile information
  const { data: profile, isLoading: profileLoading } = useQuery<InfoSearchProfile>({
    queryKey: ["/api/infosearch/profile"],
  });

  // Basic search mutation
  const basicSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/infosearch/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    },
    onSuccess: (data: { results: InfoSearchResult[] }) => {
      setSearchResults(data.results || []);
    },
  });

  // Extended search mutation
  const extendedSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/infosearch/extended-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data;
    },
    onSuccess: (data: { results: InfoSearchResult[] }) => {
      setSearchResults(data.results || []);
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setSearchResults([]);
    if (searchType === "basic") {
      basicSearchMutation.mutate(searchQuery);
    } else {
      extendedSearchMutation.mutate(searchQuery);
    }
  };

  const isSearching = basicSearchMutation.isPending || extendedSearchMutation.isPending;
  const searchError = basicSearchMutation.error || extendedSearchMutation.error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 dark:from-background dark:to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-page-title">
            Пробив данных
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Поиск информации в базах данных
          </p>
        </div>

        {/* Profile Card */}
        {profile && (
          <Card className="mb-6 border-primary/20" data-testid="card-profile">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Профиль API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Приложение</p>
                  <p className="font-medium" data-testid="text-profile-name">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Баланс</p>
                  <p className="font-medium text-green-600 dark:text-green-400" data-testid="text-profile-balance">
                    {profile.balance.toFixed(2)} ₽
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Создано</p>
                  <p className="font-medium text-sm" data-testid="text-profile-created">
                    {new Date(profile.creation_date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {profileLoading && (
          <Card className="mb-6">
            <CardContent className="py-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        )}

        {/* Search Card */}
        <Card className="mb-6" data-testid="card-search">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Поиск
            </CardTitle>
            <CardDescription>
              Введите запрос для поиска информации
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "basic" | "extended")} className="mb-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="basic" data-testid="tab-basic-search">
                  Обычный поиск
                </TabsTrigger>
                <TabsTrigger value="extended" data-testid="tab-extended-search">
                  Расширенный поиск
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Input
                placeholder="Например: Иванов Иван, телефон, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={isSearching}
                className="flex-1"
                data-testid="input-search-query"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                data-testid="button-search"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Поиск...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Найти
                  </>
                )}
              </Button>
            </div>

            {searchError && (
              <Alert variant="destructive" className="mt-4" data-testid="alert-search-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(searchError as Error).message || "Ошибка при выполнении поиска"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" data-testid="text-results-title">
                Результаты поиска
              </h2>
              <Badge variant="secondary" data-testid="badge-results-count">
                {searchResults.length} {searchResults.length === 1 ? 'результат' : 'результатов'}
              </Badge>
            </div>

            {searchResults.map((result, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`card-result-${index}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Запись #{index + 1}
                  </CardTitle>
                  {result.database && (
                    <CardDescription data-testid={`text-result-database-${index}`}>
                      База данных: {result.database}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(result).map(([key, value]) => {
                      if (key === 'database') return null;
                      return (
                        <div key={key} className="border-l-2 border-primary/30 pl-3">
                          <dt className="text-sm font-medium text-muted-foreground mb-1">
                            {key}
                          </dt>
                          <dd className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded" data-testid={`text-result-${index}-${key.toLowerCase().replace(/\s+/g, '-')}`}>
                            {value || '—'}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No results message */}
        {!isSearching && searchResults.length === 0 && (basicSearchMutation.isSuccess || extendedSearchMutation.isSuccess) && (
          <Card data-testid="card-no-results">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                По вашему запросу ничего не найдено
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
