'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/admin/login/actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign In'}
    </Button>
  );
}

export function LoginForm() {
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setError('');
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleSubmit}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              required
            />
          </div>

          <div className="space-y-2">
            <Input
              type="password"
              name="password"
              placeholder="Password"
              required
            />
          </div>

          <SubmitButton />
        </CardContent>
      </Card>
    </form>
  );
}
