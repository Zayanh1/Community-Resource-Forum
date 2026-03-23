import { useEffect, useState } from "react";

const frequencies = {
  everySecond: 1000,
  everyMinute: 60 * 1000,
  everyHour: 60 * 60 * 1000,
};

export default function useNow(update: keyof typeof frequencies) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setNow(new Date());
      },
      frequencies[update] - (now.getTime() % frequencies[update]),
    );

    return () => clearTimeout(timeout);
  }, [now, update]);

  return now;
}
