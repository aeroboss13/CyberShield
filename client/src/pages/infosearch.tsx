import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface InfoSearchResult {
  [key: string]: string;
}

export default function InfoSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InfoSearchResult[]>([]);

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/infosearch/search?q=${encodeURIComponent(query)}`);
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
    searchMutation.mutate(searchQuery);
  };

  const isSearching = searchMutation.isPending;
  const searchError = searchMutation.error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 dark:from-background dark:to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-page-title">
            Пробив данных
          </h1>
          <p className="text-muted-foreground mb-6" data-testid="text-page-description">
            Поиск информации в базах данных
          </p>
          
          {/* Description */}
          <div className="bg-card/50 border rounded-lg p-6 mb-6">
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-semibold text-primary">👤 Поиск по имени/ФИО</span>
                <div className="ml-4 mt-2 space-y-1 text-muted-foreground">
                  <div>├ Иван 2000</div>
                  <div>├ Иван Иванов 01.01</div>
                  <div>├ Иванов Иван Иванович 01.01.2000</div>
                  <div>└ Иванов Иван Иванович Москва 2000</div>
                </div>
              </div>
              
              <div>
                <span className="font-semibold text-primary">🚗 Поиск по авто</span>
                <div className="ml-4 mt-2 space-y-1 text-muted-foreground">
                  <div>├ А001АА77 - поиск по Гос номеру</div>
                  <div>└ XTA212130T1186583 - поиск по VIN</div>
                </div>
              </div>
              
              <div>
                <span className="font-semibold text-primary">🌐 Поиск по контактным данным</span>
                <div className="ml-4 mt-2 space-y-1 text-muted-foreground">
                  <div>├ 79221110500 - поиск по Телефону</div>
                  <div>├ ivanov@mail.ru - поиск по Почте</div>
                  <div>├ @username - поиск по Телеграм</div>
                  <div>└ Igrok777 - поиск по Логину</div>
                </div>
              </div>
              
              <div>
                <span className="font-semibold text-primary">🏛 Поиск по документам</span>
                <div className="ml-4 mt-2 space-y-1 text-muted-foreground">
                  <div>├ 4616233456 / 4616 233456 - поиск по Паспорту</div>
                  <div>├ 7707083893 - поиск по ИНН (ЮЛ / ФЛ)</div>
                  <div>├ 00461487830 - поиск по СНИЛС</div>
                  <div>└ 1027739099772 - поиск по ОГРН</div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-muted-foreground">
                  <strong>Для запроса просто введите данные, которые у вас есть на человека в формате представленном выше и отправьте их на проверку</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <Card className="mb-6" data-testid="card-search">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Поиск
            </CardTitle>
            <CardDescription>
              Введите данные для поиска в указанном выше формате
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Введите данные для поиска..."
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
        {!isSearching && searchResults.length === 0 && searchMutation.isSuccess && (
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
