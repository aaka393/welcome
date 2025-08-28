import UserMenu from "../components/UserMenu";

const Booking = () => {

    return (
        <div>
            <div className="flex justify-between items-center p-4 bg-gray-100">
                <h1>Booking</h1>
                <UserMenu />
            </div>
            {/* Other booking page content */}
        </div>
    );
};

export default Booking;