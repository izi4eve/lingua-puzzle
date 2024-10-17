import React from 'react';

const Title = ({ icon, text }) => {
    return (
        <div className="row">
            <div className="col-auto pe-1">
                {icon}
            </div>

            <div className="col ps-1 pt-1">
                <h5>{text}</h5>
            </div>
        </div>
    );
};

export default Title;