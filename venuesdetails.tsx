import { useState, useMemo } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Users,
  Star,
  Wifi,
  Projector,
  Coffee,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  CheckCircle2,
  Armchair,
  DoorOpen,
  Presentation,
  ClipboardList,
  Monitor,
  Video,
  Volume2,
  Utensils,
  Droplets,
  Bath,
  ShieldCheck,
  Car,
  Headphones,
  Loader2,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  formatPrice,
  getRoomTypeLabel,
  durationOptions,
  allFacilities,
  calculateTotalPrice,
  type Room,
  type DurationId,
} from "@shared/schema";

const facilityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  armchair: Armchair,
  "door-open": DoorOpen,
  wifi: Wifi,
  projector: Projector,
  presentation: Presentation,
  "clipboard-list": ClipboardList,
  monitor: Monitor,
  video: Video,
  "volume-2": Volume2,
  utensils: Utensils,
  coffee: Coffee,
  droplets: Droplets,
  bath: Bath,
  "shield-check": ShieldCheck,
  car: Car,
  headphones: Headphones,
};

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM", "08:00 PM",
];

function RoomDetailSkeleton() {
  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomDetail() {
  const [, params] = useRoute("/rooms/:id");
  const [, setLocation] = useLocation();
  
  const { data: room, isLoading, isError } = useQuery<Room>({
    queryKey: ["/api/rooms", params?.id],
    enabled: !!params?.id,
  });

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<DurationId>("2hours");

  const [selectedPaidFacilities, setSelectedPaidFacilities] = useState<Record<string, number>>({});

  const handleFacilityToggle = (id: string, checked: boolean) => {
    setSelectedPaidFacilities(prev => {
      const next = { ...prev };
      if (checked) {
        next[id] = 1;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const handleFacilityQtyChange = (id: string, qty: number) => {
    setSelectedPaidFacilities(prev => ({
      ...prev,
      [id]: qty
    }));
  };

  const totalPrice = useMemo(() => {
    if (!room) return { min: 0, max: 0 };
    const base = calculateTotalPrice(room, selectedDuration);
    const paidTotal = Object.entries(selectedPaidFacilities).reduce((acc, [id, qty]) => {
      const f = allFacilities.find(fac => fac.id === id);
      return acc + (f?.price || 0) * qty;
    }, 0);
    return {
      min: base.min + paidTotal,
      max: base.max + paidTotal
    };
  }, [room, selectedDuration, selectedPaidFacilities]);

  if (isLoading) {
    return <RoomDetailSkeleton />;
  }

  if (isError || !room) {
    return (
      <div className="min-h-screen pt-28 lg:pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-2xl font-bold mb-4">Venue Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The venue you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/rooms">
              <Button data-testid="button-back-to-rooms">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Venues
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const handleBookNow = () => {
    if (!selectedDate || !selectedTime) return;

    const bookingData = {
      roomId: room.id,
      roomName: room.name,
      date: format(selectedDate, "yyyy-MM-dd"),
      startTime: selectedTime,
      duration: selectedDuration,
      totalPrice,
      paidFacilities: selectedPaidFacilities
    } as any;

    sessionStorage.setItem("pendingBooking", JSON.stringify(bookingData));
    setLocation("/booking");
  };

  const canBook = selectedDate && selectedTime;

  return (
    <div className="min-h-screen pt-28 lg:pt-32 pb-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/rooms" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to all venues
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl group">
                <img
                  src={room.images[selectedImageIndex]}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {room.featured && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                {room.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                      onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? room.images.length - 1 : prev - 1))}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                      onClick={() => setSelectedImageIndex((prev) => (prev === room.images.length - 1 ? 0 : prev + 1))}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {room.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {room.images.map((img, idx) => (
                    <button
                      key={idx}
                      className={`relative flex-shrink-0 w-24 aspect-video rounded-md overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                      }`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img src={img} alt={`${room.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Badge variant="outline" className="mb-3">
                {getRoomTypeLabel(room.type)}
              </Badge>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-4" data-testid="text-room-name">
                {room.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{room.capacity.min}-{room.capacity.max} persons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Venue booking (Lightweight changes free)</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {room.description}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Included Facilities (Free)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allFacilities
                    .filter((f) => f.type === "free" && room.facilities.includes(f.id))
                    .map((facility) => {
                      const IconComponent = facilityIcons[facility.icon] || CheckCircle2;
                      return (
                        <div
                          key={facility.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-sm">{facility.name}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <PlusCircle className="h-5 w-5" />
                  Paid Facilities (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allFacilities
                    .filter((f) => f.type === "paid")
                    .map((facility) => {
                      const IconComponent = facilityIcons[facility.icon] || CheckCircle2;
                      return (
                        <div
                          key={facility.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background border border-primary/10"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{facility.name}</span>
                              <span className="text-[10px] text-primary">
                                {formatPrice(facility.price!)} {facility.unit}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {facility.unit !== "Fixed" && (
                              <Input
                                type="number"
                                className="w-16 h-8 text-xs"
                                placeholder="Qty"
                                min="1"
                                value={selectedPaidFacilities[facility.id] || ""}
                                onChange={(e) => handleFacilityQtyChange(facility.id, parseInt(e.target.value) || 1)}
                                disabled={!selectedPaidFacilities[facility.id]}
                              />
                            )}
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                              checked={!!selectedPaidFacilities[facility.id]}
                              onChange={(e) => handleFacilityToggle(facility.id, e.target.checked)}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {durationOptions.map((option) => {
                    const price = calculateTotalPrice(room, option.id);
                    return (
                      <div
                        key={option.id}
                        className={`p-4 rounded-lg border text-center transition-colors ${
                          selectedDuration === option.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="font-semibold mb-1">{option.label}</div>
                        <div className="text-sm text-primary font-bold">
                          {formatPrice(price.min)} - {formatPrice(price.max)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Book This Venue</span>
                  <Badge variant="secondary" className="font-normal">
                    From {formatPrice(room.pricing.hourly.min)}/hr
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-select-date"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span className="text-muted-foreground">Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        data-testid="calendar-date"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger data-testid="select-time">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block">Duration</Label>
                  <RadioGroup
                    value={selectedDuration}
                    onValueChange={(value) => setSelectedDuration(value as DurationId)}
                    className="grid grid-cols-2 gap-2"
                  >
                    {durationOptions.map((option) => (
                      <div key={option.id}>
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={option.id}
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors text-center"
                          data-testid={`radio-duration-${option.id}`}
                        >
                          <span className="text-sm font-medium">{option.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Estimated Total</span>
                    <span className="font-bold text-lg text-primary" data-testid="text-total-price">
                      {formatPrice(totalPrice.min)} - {formatPrice(totalPrice.max)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Final price depends on selected facilities and add-ons
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!canBook}
                  onClick={handleBookNow}
                  data-testid="button-reserve"
                >
                  Reserve Now
                </Button>

                {!canBook && (
                  <p className="text-xs text-center text-muted-foreground">
                    Please select a date and time to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
