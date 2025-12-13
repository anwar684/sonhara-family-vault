import { useMemberLoginSummary, useLoginActivity } from '@/hooks/useLoginActivity';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Clock, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function LoginActivityCard() {
  const { data: summaries, isLoading: summariesLoading } = useMemberLoginSummary();
  const { data: recentLogins, isLoading: loginsLoading } = useLoginActivity(20);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-gold" />
        <h2 className="font-serif text-xl font-bold">Member Login Activity</h2>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="history">Recent Logins</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {summariesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !summaries?.length ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No members with login accounts yet.
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {summaries.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-navy/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-navy" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.member_name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {member.last_login ? (
                        <>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(member.last_login), { addSuffix: true })}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {member.login_count} logins
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Never logged in
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="history">
          {loginsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !recentLogins?.length ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No login activity recorded yet.
            </p>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {recentLogins.map((login) => (
                  <div
                    key={login.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{login.email || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(login.login_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(new Date(login.login_at), { addSuffix: true })}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
