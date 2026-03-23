"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { getDate } from "date-fns";
import { useCallback, useId, useState } from "react";
import {
  PiArrowCounterClockwiseBold,
  PiCalendarBlank,
  PiCalendarBold,
  PiCheckBold,
  PiClockCountdownBold,
  PiMagnifyingGlass,
  PiMapPinBold,
  PiPlusBold,
  PiTextTBold,
  PiUsersBold,
} from "react-icons/pi";
import * as Combobox from "~/components/Combobox";
import formatEventTime from "~/lib/formatEventTime";
import type { events, profiles } from "~/server/db/schema/tables";
import SelectProfile from "~/components/SelectProfile";
import SelectDateTimeRange from "./SelectDateTimeRange";
import SelectTags from "../SelectTags";

type Event = (typeof events)["$inferSelect"];
type Profile = (typeof profiles)["$inferSelect"];

interface Props {
  events: Event[];
  userProfile: Profile;
  organizationProfiles: Profile[];
}

export default function SelectEvent({
  events,
  userProfile,
  organizationProfiles,
}: Props) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<Event | null>(null);
  const [createNew, setCreateNew] = useState<boolean>(false);
  const id = useId();

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(query.toLowerCase()),
  );

  const updateSelection = useCallback((event: Event | null) => {
    if (event) {
      setValue(event);
      setQuery("");
    }
  }, []);

  return (
    <Collapsible.Root
      className="flex w-full flex-col gap-2"
      open={createNew}
      onOpenChange={setCreateNew}
    >
      <label className="flex items-center gap-2 font-bold" htmlFor={id}>
        <PiCalendarBold /> Include Event
      </label>

      <input type="hidden" name="event.id" value={value?.id ?? ""} readOnly />

      <div className="flex items-center gap-2">
        <Combobox.Root popover>
          <div className="relative grow">
            <Combobox.Input
              className="w-full rounded-sm bg-white py-1 pr-3 pl-10 ring ring-gray-400 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              id={id}
              disabled={createNew}
              placeholder="Search your events..."
            />

            <span
              className="group absolute inset-y-0 top-1/2 left-0 -translate-y-1/2 px-3"
              suppressHydrationWarning
            >
              <PiMagnifyingGlass className="size-4 fill-black/60 group-data-hover:fill-black" />
            </span>
          </div>

          <Combobox.Options className="group w-full origin-top transition-opacity perspective-distant data-[state=closed]:pointer-events-none! data-[state=closed]:opacity-0 data-[state=open]:pointer-events-auto!">
            <div className="bg-scroll-shadow max-h-65.5 w-full scroll-py-1 space-y-1 overflow-y-scroll rounded-sm border border-gray-600 p-1 shadow-xl transition-[transform,opacity,scale] transform-3d group-data-[state=closed]:scale-95 group-data-[state=closed]:-rotate-x-12">
              {filteredEvents.length <= 0 && (
                <p className="px-3 py-1 text-sm text-gray-500 italic">
                  No results found.
                </p>
              )}
              {filteredEvents.map((event) => (
                <Combobox.Option
                  key={event.id}
                  className="group flex cursor-default items-center gap-2 rounded-sm px-3 py-1.5 select-none data-focus:bg-black/10"
                  onClick={() => updateSelection(event)}
                >
                  <div className="flex flex-1 items-center gap-3 py-0.5 text-xl text-black">
                    <span className="relative">
                      <PiCalendarBlank />
                      <span className="absolute inset-0 top-1/2 w-full -translate-y-1/2 pt-px text-center text-[0.55rem] font-bold">
                        {getDate(event.start)}
                      </span>
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm/[1]">{event.title}</span>
                      <span className="text-[0.6rem]/[1] font-bold text-gray-600">
                        {formatEventTime(event)}
                      </span>
                    </span>
                  </div>
                  <PiCheckBold className="invisible size-4 fill-black group-data-selected:visible" />
                </Combobox.Option>
              ))}
            </div>
          </Combobox.Options>
        </Combobox.Root>

        <Collapsible.Trigger className="group flex items-center justify-center gap-2 rounded-md bg-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-900 ring ring-gray-400 transition-[box-shadow,background-color] hover:bg-gray-200 hover:shadow-md hover:ring-gray-500 data-[state=open]:bg-gray-100 data-[state=open]:shadow-xs data-[state=open]:hover:bg-gray-200 data-[state=open]:hover:shadow-md">
          <span className="hidden group-data-[state=open]:contents">
            <PiArrowCounterClockwiseBold />
            Use Existing
          </span>
          <span className="contents group-data-[state=open]:hidden">
            <PiPlusBold />
            Create New
          </span>
        </Collapsible.Trigger>
      </div>

      <Collapsible.Content className="data-[state=open]:animate-collapsible-open animate-collapsible-closed block overflow-hidden rounded-md border border-gray-400 bg-gray-100 shadow-xs transition-[height] data-[state=closed]:inset-shadow-sm">
        <div className="flex flex-col gap-7 px-5 pt-4 pb-7">
          <div className="flex w-full flex-col gap-2">
            <label className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiUsersBold className="-scale-x-100" /> Organizer
            </label>

            <SelectProfile
              inputName="event.organizerId"
              userProfile={userProfile}
              organizationProfiles={organizationProfiles}
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <label className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiClockCountdownBold /> Schedule
            </label>

            <SelectDateTimeRange
              inputNames={{
                startDay: "event.startDay",
                startTime: "event.startTime",
                endDay: "event.endDay",
                endTime: "event.endTime",
                allDay: "event.allDay",
              }}
            />
          </div>

          <label className="flex w-full flex-col gap-2">
            <span className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiTextTBold /> Title
            </span>

            <span className="relative mx-auto block w-full max-w-xl">
              <input
                className="w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400"
                name="event.title"
                placeholder="My Awesome Event"
                type="text"
                required
              />
            </span>
          </label>

          <SelectTags inputName="event.tags" />

          <label className="flex w-full flex-col gap-2">
            <span className="mx-auto flex w-full max-w-xl items-center gap-2 font-bold">
              <PiMapPinBold /> Location
            </span>

            <span className="relative mx-auto block w-full max-w-xl">
              <input
                className="w-full rounded-sm bg-white px-3 py-1 ring ring-gray-400"
                name="event.location"
                placeholder="(optional)"
              />
            </span>
          </label>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
