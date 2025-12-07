import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BookingSummaryProps {
  title: string;
  destination: string;
  subtotal: number;
  total: number;
  currency?: string;
}

export const BookingSummaryCard: React.FC<BookingSummaryProps> = ({
  title,
  destination,
  subtotal,
  total,
  currency = 'PKR',
}) => {
  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {destination}
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {currency} {subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Total
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currency} {total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
